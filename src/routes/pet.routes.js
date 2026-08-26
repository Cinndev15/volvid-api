import { Router } from "express";
import {
  registerPet,
  getMyPets,
  reportLostPet,
  markPetAsFound,
  getLostPets,
  getPetLostReport
} from "../controllers/pet.controller.js";
import { ownerAuthMiddleware } from "../middlewares/ownerAuth.js";
import { registerPetValidationRules, reportLostPetValidationRules } from "../middlewares/validate.js";

const router = Router();

// GET /api/pets/lost - Public feed of all currently lost pets (must be before /:id)
router.get("/lost", getLostPets);

// POST /api/pets - Register a new pet (authenticated owner)
router.post("/", ownerAuthMiddleware, registerPetValidationRules, registerPet);

// GET /api/pets - List pets of authenticated owner
router.get("/", ownerAuthMiddleware, getMyPets);

// GET /api/pets/:id/lost-report - Get active lost report for a specific pet
router.get("/:id/lost-report", getPetLostReport);

// POST /api/pets/:id/report-lost - Report pet as lost (creates SOS alert)
router.post("/:id/report-lost", ownerAuthMiddleware, reportLostPetValidationRules, reportLostPet);

// POST /api/pets/:id/mark-found - Mark pet as found (resolves SOS alert)
router.post("/:id/mark-found", ownerAuthMiddleware, markPetAsFound);

export default router;
