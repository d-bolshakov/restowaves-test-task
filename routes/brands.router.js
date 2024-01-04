const brandsController = require("../controllers/brands.controller");
const { Router } = require("express");

const router = new Router();

router.get("/", brandsController.getMany);
router.post("/", brandsController.create);
router.get("/:id", brandsController.getOneById);
router.put("/:id", brandsController.update);
router.delete("/:id", brandsController.delete);

module.exports = router;
