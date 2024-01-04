const express = require("express");
const productsRouter = require("./routes/products.router");
const brandsRouter = require("./routes/brands.router");
const modelsRouter = require("./routes/models.router");
const categoriesRouter = require("./routes/categories.router");
const db = require("./db/database");
const { CronJob } = require("cron");
const syncService = require("./services/sync.service");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use("/products/", productsRouter);
app.use("/brands/", brandsRouter);
app.use("/models/", modelsRouter);
app.use("/categories/", categoriesRouter);

// створення cron job для щогодинної звірки даних з таблиці з даними у бд
const dbSyncJob = CronJob.from({
  cronTime: "0 * * * *",
  onTick: syncService.main,
  start: true,
  context: syncService,
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
db.authenticate()
  .then(() => console.log("DB connection has been established successfully"))
  .catch((err) => console.error("DB connection error", err));
