import mongoose from 'mongoose';

/**
 * Basket — a Choice Based Credit System (CBCS) credit bucket.
 * CUTM groups every course into a basket (e.g. Core, Program Elective,
 * Skill Enhancement, Foundation, Discipline Elective, Project/Internship).
 *
 * HoDs define the baskets available in their department/programme and the
 * default credit requirement for each. `aliases` lets the gradesheet parser
 * recognise the basket even when the PDF prints a slightly different label.
 */
const BasketSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },      // "Program Core"
    code: { type: String, trim: true, uppercase: true },      // "PC"
    description: String,
    // Aliases the parser will also treat as this basket (case-insensitive, matched longest-first).
    aliases: [{ type: String, trim: true }],
    defaultCredits: { type: Number, default: 0 },             // suggested requirement
    order: { type: Number, default: 0 },                      // display order

    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    programme: String,                                        // optional: scope to one programme

    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

BasketSchema.index({ department: 1, name: 1 }, { unique: true });

export default mongoose.models.Basket || mongoose.model('Basket', BasketSchema);
