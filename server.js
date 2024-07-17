const express = require("express");
const bodyParser = require("body-parser");
const { getEsewaPaymentHash, verifyEsewaPayment } = require("./esewa");
const Payment = require("./models/paymentModel");
const Item = require("./models/itemModel");
const PurchasedItem = require("./models/purchasedItemModel");
const connectToMongo = require("./utils/db");

const app = express();
app.use(bodyParser.json());

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

connectToMongo();

app.post("/initialize-esewa", async (req, res) => {
  try {
    const { itemId, totalPrice } = req.body;
    const itemData = await Item.findOne({ _id: itemId, price: Number(totalPrice) });

    if (!itemData) {
      return res.status(400).send({
        success: false,
        message: "Item not found or price mismatch.",
      });
    }

    const purchasedItemData = await PurchasedItem.create({
      item: itemId,
      paymentMethod: "esewa",
      totalPrice: totalPrice,
    });

    const paymentInitiate = await getEsewaPaymentHash({
      amount: totalPrice,
      transaction_uuid: purchasedItemData._id,
    });

    res.json({
      success: true,
      payment: paymentInitiate,
      purchasedItemData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/complete-payment", async (req, res) => {
  const { data } = req.query;

  try {
    const paymentInfo = await verifyEsewaPayment(data);

    const purchasedItemData = await PurchasedItem.findById(paymentInfo.response.transaction_uuid);

    if (!purchasedItemData) {
      return res.status(500).json({
        success: false,
        message: "Purchase not found",
      });
    }

    const paymentData = await Payment.create({
      pidx: paymentInfo.decodedData.transaction_code,
      transactionId: paymentInfo.decodedData.transaction_code,
      productId: paymentInfo.response.transaction_uuid,
      amount: purchasedItemData.totalPrice,
      dataFromVerificationReq: paymentInfo,
      apiQueryFromUser: req.query,
      paymentGateway: "esewa",
      status: "success",
    });

    await PurchasedItem.findByIdAndUpdate(paymentInfo.response.transaction_uuid, { $set: { status: "completed" } });

    res.json({
      success: true,
      message: "Payment successful",
      paymentData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred during payment verification",
      error: error.message,
    });
  }
});

app.get("/create-item", async (req, res) => {
  let itemData = await Item.create({
    name: "Headphone",
    price: 500,
    inStock: true,
    category: "vayo pardaina",
  });
  res.json({
    success: true,
    item: itemData,
  });
});

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/test.html");
});

app.listen(3001, () => {
  console.log("Backend listening at http://localhost:3001");
});
