const mongoose = require("mongoose")
const Item = require("./itemModel")

const purchasedItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  totalPrice: { type: Number, required: true },
  purchaseDate: { type: Date, default: Date.now },
  paymentMethod:{type: String, enum:["esewa", "khalti"], required: true},
  status: { type: String, enum: ["pending", "completed", "refunded"], default: "pending" },
},{timestamps: true})
  

const PurchasedItem = mongoose.model("PurchasedItem", purchasedItemSchema)

module.exports = PurchasedItem