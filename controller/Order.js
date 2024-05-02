const { Order } = require('../model/Order');
const { Product } = require('../model/Product');
const { User } = require('../model/User');
const { sendMail, invoiceTemplate } = require('../services/common');

exports.fetchOrdersByUser = async (req, res) => {
  const { id } = req.user;
  try {
    const orders = await Order.find({ user: id });
    res.status(200).json(orders);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.createOrder = async (req, res) => {
  const {id} = req.params;
  const order = new Order(req.body);
  for(let item of order.items){
    await Product.findByIdAndUpdate(item.product.id,{$inc:{stock:-1*item.quantity}})
  }
  try {
    const doc = await order.save();
    const user=await User.findById(order.user);
    sendMail({to:user.email, html:invoiceTemplate(order),subject:"Order Received"})
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.deleteOrder = async (req, res) => {
    const { id } = req.params;
    try {
    const doc = await Order.findByIdAndDelete(id);
    res.status(200).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.status(200).json(order);
  } catch (err) {
    res.status(400).json(err);
  }
};


exports.fetchAllOrders = async (req, res) => {
  // console.log(req.query);
  let query = Order.find({deleted:{$ne:true}});
  let totalOrdersQuery = Order.find({deleted:{$ne:true}});
  // console.log(req.query);
  if (req.query._sort && req.query._order) {
    query = query.sort({ [req.query._sort]: req.query._order });
  }

  const totalDocs = await totalOrdersQuery.count().exec();
  // console.log({ totalDocs });

  if (req.query._page && req.query._per_page) {
    const pageSize = req.query._per_page;
    const page = req.query._page;
    query = query.skip(pageSize * (page - 1)).limit(pageSize);
  }
  // console.log(query);
    try {
      const docs = await query.exec();
      res.set("X-Total-Count", totalDocs);
      res.status(200).json(docs);
    } catch (err) {
      res.status(400).json(err);
    }
};