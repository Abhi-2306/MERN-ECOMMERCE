const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentMethods = {
  values: ["cash", "card"],
  message: "Payment method unavailable",
};
const orderSchema = new Schema(
  {
    items: { type: Schema.Types.Mixed, required: true },
    totalAmount: { type: Number },
    totalQuantity: { type: Number },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paymentMethod: { type: String, required: true, enum: paymentMethods },
    paymentStatus: { type: String, default: "pending" },
    status: { type: String, default: "pending" },
    selectedAddress: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

const virtual = orderSchema.virtual("id");
virtual.get(function () {
  return this._id;
});
orderSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    ret.createdAt = doc.createdAt;
    ret.updatedAt = doc.updatedAt;
  },
});

exports.Order = mongoose.model("Order", orderSchema);
