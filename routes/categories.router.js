const categoriesController = require("../controllers/categories.controller");
const { Router } = require("express");

const router = new Router();

router.get("/", categoriesController.getMany);
router.post("/", categoriesController.create);
router.get("/:id", categoriesController.getOneById);
router.put("/:id", categoriesController.update);
router.delete("/:id", categoriesController.delete);

module.exports = router;
