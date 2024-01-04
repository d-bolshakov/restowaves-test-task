const productsController = require("../controllers/products.controller");
const { Router } = require("express");

const router = new Router();

router.get("/", productsController.getMany);
router.get("/:id", productsController.getOneById);
router.put("/:id", productsController.update);
router.delete("/:id", productsController.delete);

module.exports = router;
