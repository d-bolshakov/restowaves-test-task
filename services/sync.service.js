const { google } = require("googleapis");
const Model = require("../db/models/Model");
const Product = require("../db/models/Product");
const Size = require("../db/models/Size");
const modelsService = require("./models.service");
const productsService = require("./products.service");
const sizesService = require("./sizes.service");

class SyncService {
  // об'єкт для тимчасового зберігання результатів звірки даних з таблиці та бд
  // використовується під час звірки та очищується після збереження змін у базі
  tempChanges = {
    models: {
      new: [],
      deleted: [],
    },
    products: {
      new: [],
      deleted: [],
      //      updated: [],
    },
    sizes: {
      new: [],
      deleted: [],
    },
    clear: () => {
      this.models = { new: [], deleted: [] };
      this.products = { new: [], /* updated: [], */ deleted: [] };
      this.sizes = { new: [], deleted: [] };
    },
  };

  // отримання даних з таблиці,
  // приведення їх до структури, у якій вони зберігаються у бд
  // та їх сортування
  async getDataFromSheets() {
    const sheets = google.sheets({
      version: "v4",
      auth: process.env.GOOGLE_API_KEY,
    });
    // отримання даних з таблиці за допомогою Google Spreadsheets API
    // має містити API key, згенерований у проекті на Google Cloud
    // а також айді таблиці
    const res = await sheets.spreadsheets.get({
      key: process.env.GOOGLE_API_KEY,
      spreadsheetId: process.env.SPREADSHEET_ID,
      includeGridData: true,
    });
    // прохід по всіх листах у таблиці, які представляють моделі
    return (
      res.data.sheets
        .map((model) => {
          const products = [];
          // визначення типу даних, які обробляються:
          // дані про товар (значення "general")
          // або дані про розміри, доступні для цього товару (значення "sizes")
          let currPropertyGroup = "general";
          // прохід по всіх колонках листа, перша колонка - заголовки властивостей, інші - дані товару
          for (const row of model.data[0].rowData) {
            let rowHeader;
            // отримання заголовку з назвою властивості, дані якої містяться у поточному рядку таблиці
            switch (currPropertyGroup) {
              case "general":
                rowHeader = row.values[0].userEnteredValue?.stringValue?.trim();
                break;
              case "sizes":
                rowHeader = row.values[0].userEnteredValue?.numberValue;
                break;

              default:
                break;
            }
            if (!rowHeader) break;
            // зміна типу поточної властивості товару, що зараз обробляється,
            // на тип розмірів якщо заголовок поточного рядка - "Розміри"
            if (rowHeader === "Розміри") {
              currPropertyGroup = "sizes";
              continue;
            }
            // прохід по всіх ячейках рядка
            for (const [i, v] of row.values.entries()) {
              // пропуск першої ячейки, оскільки в ній міститься заголовок, а не дані товару
              if (i === 0) continue;
              const cell =
                v.userEnteredValue?.stringValue?.trim() ||
                v.userEnteredValue?.numberValue;
              if (!cell) continue;
              if (currPropertyGroup === "general") {
                // створення об'єкту товару та встановлення у ньому відповідних властивостей
                // в залежності від заголовку властивості що обробляється
                switch (rowHeader) {
                  case "Імя":
                    products.push({
                      name: cell,
                    });
                    break;

                  case "Ціна":
                    products[i - 1].price = cell;
                    break;

                  case "Код товару":
                    products[i - 1].code = cell;
                    break;

                  default:
                    break;
                }
              } else if (currPropertyGroup === "sizes")
                // додавання до об'єкту товару розмірів, які у таблиці відмічені знаком +
                products[i - 1].sizes
                  ? products[i - 1].sizes.push({
                      size: rowHeader,
                    })
                  : (products[i - 1].sizes = [{ size: rowHeader }]);
            }
          }
          return {
            name: model.properties.title,
            // сортування товарів моделі за артиклем
            products: products.sort((a, b) => a.code - b.code),
          };
        })
        // сортування моделей за назвою
        .sort((a, b) => {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }
          return 0;
        })
    );
  }

  async getDatafromDb() {
    try {
      // отримання з бази даних моделей з відповідними їм товарами та їх розмірами
      return Model.findAll({
        order: [
          // сортування моделей за назвою
          // сортування товарів за артиклем
          // сортування розмірів за значенням розміру
          ["name", "ASC"],
          [Product, "code", "ASC"],
          [Product, Size, "size", "ASC"],
        ],
        include: {
          model: Product,
          as: "products",
          include: {
            model: Size,
            as: "sizes",
          },
        },
      });
    } catch (error) {
      console.error("DB connection error", error);
    }
  }

  // порівняння розмірів відповідних товарів з таблиці та з бд
  compareSizes(sheetData, dbData, productId) {
    let i = 0;
    const deletedSizes = [];
    const newSizes = [];

    // прохід по розмірам з таблиці та бд
    while (i < sheetData.length || i < dbData.length) {
      // порівняння розмірів, у випадку співпадіння - перехід на наступну ітерацію
      if (sheetData[i] && dbData[i] && sheetData[i].size === dbData[i].size) {
        i++;
        continue;
      }
      // у випадку неспівпадіння поточних розмірів
      if (sheetData[i]) {
        // порівння поточного розміру з таблиці з головою черги видалених
        // у випадку співпадіння - видалення розміру що співпав з черги видалених
        // інакше - додавання у чергу нових
        if (sheetData[i].size === deletedSizes[0]?.size) {
          deletedSizes.shift();
        } else newSizes.push({ productId, ...sheetData[i] });
      }
      // порівння поточного розміру з бд з головою черги нових
      // у випадку співпадіння - видалення розміру що співпав з черги нових
      // інакше - додавання у чергу видалених
      if (dbData[i]) {
        if (dbData[i].size === newSizes[0]?.size) {
          newSizes.shift();
        } else deletedSizes.push(dbData[i]);
      }
      i++;
    }
    // додавання результатів звірки у тимчасовий об'єкт результатів
    this.tempChanges.sizes.new.push(...newSizes);
    this.tempChanges.sizes.deleted.push(...deletedSizes);
  }

  // звірка товарів даних моделей з таблиці та бд,
  // відбувається аналогічним чином до порівняння моделей
  compareProducts(sheetData, dbData, modelId) {
    let i = 0;
    const deletedProducts = [];
    // const updatedProducts = [];
    const newProducts = [];
    // прохід по товарам з таблиці та з бд
    while (i < sheetData.length || i < dbData.length) {
      // порівняння артиклів даних товарів
      if (sheetData[i] && dbData[i] && sheetData[i].code === dbData[i].code) {
        // порівняння розмірів та перехід на наступну ітерацію
        this.compareSizes(sheetData[i].sizes, dbData[i].sizes, dbData[i].id);
        // if (
        //   sheetData[i].name !== dbData[i].name ||
        //   sheetData[i].price !== dbData[i].price
        // )
        //   updatedProducts.push({
        //     id: dbData[i].id,
        //     code: dbData[i].code,
        //     modelId: dbData[i].modelId,
        //     name: sheetData[i].name,
        //     price: sheetData[i].price,
        //   });
        i++;
        continue;
      }
      // у раз неспівпадіння артиклів
      if (sheetData[i]) {
        // порівння даного товару з таблиці з головою черги видалених
        if (sheetData[i].code === deletedProducts[0]?.code) {
          // порівняння розмірів
          this.compareSizes(
            sheetData[i].sizes,
            deletedProducts[0].sizes,
            deletedProducts[0].id
          );
          // звірка назви та ціни товару, що місяться у таблиці, з даними з бд
          // та додавання товару до масиву оновлених у випадку неспівпадіння
          //
          //   if (
          //     sheetData[i].name !== deletedProducts[0].name ||
          //     sheetData[i].price !== deletedProducts[0].price
          //   )
          //     updatedProducts.push({
          //       id: deletedProducts[0].id,
          //       code: deletedProducts[0].code,
          //       modelId: deletedProducts[0].modelId,
          //       name: sheetData[i].name,
          //       price: sheetData[i].price,
          //     });

          // видалення товару що співпав з черги видалених товарів
          deletedProducts.shift();
          // у випадку неспівпадіння, додавання товару у чергу нових
        } else newProducts.push({ modelId, ...sheetData[i] });
      }
      if (dbData[i]) {
        // порівняння поточного товару з бд з головою черги нових
        if (dbData[i].code === newProducts[0]?.code) {
          // порівняння розмірів
          this.compareSizes(
            newProducts[0].sizes,
            dbData[i].sizes,
            dbData[i].id
          );
          // порівняння назви та ціни, у випадку неспівпадіння - додавання у масив оновлених
          //   if (
          //     dbData[i].name !== newProducts[0].name ||
          //     dbData[i].price !== newProducts[0].price
          //   )
          //     updatedProducts.push({
          //       id: dbData[i].id,
          //       code: dbData[i].code,
          //       modelId: dbData[i].modelId,
          //       name: newProducts[0].name,
          //       price: newProducts[0].price,
          //     });
          //
          // видаленні товару, що співпав з черги нових
          newProducts.shift();
          // у випадку неспівпадіння - додавання товару з бд у чергу видалених
        } else deletedProducts.push(dbData[i]);
      }
      i++;
    }
    // додавання результатів звірки у тимчасовий об'єкт результатів
    this.tempChanges.products.new.push(...newProducts);
    //    this.tempChanges.products.updated.push(...updatedProducts);
    this.tempChanges.products.deleted.push(...deletedProducts);
  }

  // метод для звірки даних про моделі з таблиці та з бд
  compare(sheetData, dbData) {
    let i = 0;
    // ініціалізація двох черг для нових і видалених моделей
    const deletedModels = [];
    const newModels = [];

    // одночаний прохід по масивах моделей з таблиці та бд
    // у разі співпадіння поточних моделей - перевірка товарів
    // у разі неспівпадіння:
    //
    // порівняння поточної моделі з таблиці з головою черги видалених:
    // у випадку співпадіння - перевірка товарів та видалення моделі з голови черги видалених
    // у випадку неспівпадіння - додавання моделі до черги нових
    //
    // порівняння поточної моделі з бд з головою черги нових:
    // у випадку співпадіння - перевірка товарів та видалення моделі з чергинових
    // у випадку неспівпадіння - додавання моделі з бд у чергу видаленних
    while (i < sheetData.length || i < dbData.length) {
      // звірка поточних моделей, у разі співпадіння - перевірка товарів та перехід на наступну ітерацію
      if (sheetData[i] && dbData[i] && sheetData[i].name === dbData[i].name) {
        this.compareProducts(
          sheetData[i].products,
          dbData[i].products,
          dbData[i].id
        );
        i++;
        continue;
      }
      // у разі неспівпадіння поточних моделей з таблиці та бд
      if (sheetData[i]) {
        // звірка поточної моделі з таблиці з першою у черзі видалених
        if (sheetData[i].name === deletedModels[0]?.name) {
          // звірка товарів
          this.compareProducts(
            sheetData[i].products,
            deletedModels[0].products,
            deletedModels[0].id
          );
          // видалення моделі, що співпала з голови черги видалених
          deletedModels.shift();
          // у випадку неспівпадіння - додавання поточної моделі з таблиці у чергу нових
        } else newModels.push(sheetData[i]);
      }
      if (dbData[i]) {
        // звірка поточної моделі з бд з головою черги нових
        if (dbData[i].name === newModels[0]?.name) {
          // звірка товарів
          this.compareProducts(
            newModels[0].products,
            dbData[i].products,
            dbData[i].id
          );
          // видалення моделі, що співпала з голови черги нових
          newModels.shift();
          // у випадку неспівпадіння - додавання поточної моделі з бд у чергу видалених
        } else deletedModels.push(dbData[i]);
      }
      i++;
    }
    // після закінчення звірки, черги нових та видалених моделей
    // додаються у тимчасовий об'єкт з результатами звірки
    this.tempChanges.models.new.push(...newModels);
    this.tempChanges.models.deleted.push(...deletedModels);
  }

  // збереження змін у бд
  // при наявності нових моделей - збереження їх до бд
  // при наявності видалених моделей - видалення їх з бд
  // аналогічно для товарів та розмірів
  async syncChanges() {
    try {
      if (this.tempChanges.models.new.length)
        await modelsService.createMany(this.tempChanges.models.new);
      if (this.tempChanges.models.deleted.length)
        await modelsService.deleteMany(
          this.tempChanges.models.deleted.map((m) => m.id)
        );
      if (this.tempChanges.products.new.length)
        await productsService.createMany(this.tempChanges.products.new);
      //   if (this.tempChanges.products.updated.length)
      //     await productsService.updateMany(this.tempChanges.products.updated);
      if (this.tempChanges.products.deleted.length)
        await productsService.deleteMany(
          this.tempChanges.products.deleted.map((p) => p.id)
        );
      if (this.tempChanges.sizes.new.length)
        await sizesService.createMany(this.tempChanges.sizes.new);
      if (this.tempChanges.sizes.deleted.length)
        await sizesService.deleteMany(
          this.tempChanges.sizes.deleted.map((s) => s.id)
        );
    } catch (err) {
      console.error("Error during sync", err);
    }
  }

  async main() {
    // очищення тимчасового об'єкту з результатами перевірки
    this.tempChanges.clear();
    const sheetData = await this.getDataFromSheets();
    const dbData = await this.getDatafromDb();
    // звірка даних з таблиці з даними з бд
    this.compare(sheetData, dbData);
    // збереження змін у бд
    await this.syncChanges();
    // очищення тимчасового об'єкту з результатами перевірки
    this.tempChanges.clear();
  }
}

module.exports = new SyncService();
