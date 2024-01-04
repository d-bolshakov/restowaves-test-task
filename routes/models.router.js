const modelsController = require("../controllers/models.controller");
const { Router } = require("express");

const router = new Router();

router.get("/", modelsController.getMany);
router.get("/:id", modelsController.getOneById);
router.put("/:id", modelsController.update);
router.delete("/:id", modelsController.delete);

module.exports = router;
