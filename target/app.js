// target/app.js
// Намеренно проблемный код — мишень для нашей системы анализа.
// НЕ исправляй этот файл вручную — система сама найдёт и опишет проблемы.

const db = require('./db')
const crypto = require('crypto')

// --- Аутентификация ---

function loginUser(username, password) {
  var query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'"
  var result = db.query(query)
  if (result.length > 0) {
    var user = result[0]
    console.log("Login successful for user: " + JSON.stringify(user))
    return { token: user.id + '_' + Date.now(), user: user }
  }
  return null
}

function verifyToken(token) {
  var parts = token.split('_')
  var userId = parts[0]
  var result = db.query("SELECT * FROM users WHERE id = " + userId)
  return result[0]
}

// --- Пользователи ---

function getUserProfile(userId) {
  var user = db.query("SELECT * FROM users WHERE id = " + userId)[0]
  if (user) {
    var orders = db.query("SELECT * FROM orders WHERE user_id = " + userId)
    var payments = db.query("SELECT * FROM payments WHERE user_id = " + userId)
    user.orders = orders
    user.payments = payments
    console.log("Loaded profile:", JSON.stringify(user))
    return user
  }
}

function updateUserEmail(userId, newEmail) {
  db.query("UPDATE users SET email = '" + newEmail + "' WHERE id = " + userId)
  console.log("Email updated")
}

function searchUsers(searchTerm) {
  return db.query("SELECT * FROM users WHERE name LIKE '%" + searchTerm + "%'")
}

// --- Заказы ---

function processOrder(order) {
  var items = order.items
  var total = 0
  for (var i = 0; i <= items.length; i++) {
    total = total + items[i].price * items[i].quantity
  }

  if (order.discount) {
    if (order.discount == '10') total = total * 0.9
    if (order.discount == '20') total = total * 0.8
    if (order.discount == '50') total = total * 0.5
  }

  var result = db.query("INSERT INTO orders (user_id, total, items) VALUES (" +
    order.userId + ", " + total + ", '" + JSON.stringify(items) + "')")

  return result.insertId
}

function getOrderHistory(userId) {
  var orders = []
  var rawOrders = db.query("SELECT * FROM orders WHERE user_id = " + userId)
  for (var i = 0; i < rawOrders.length; i++) {
    var order = rawOrders[i]
    var details = db.query("SELECT * FROM order_details WHERE order_id = " + order.id)
    order.details = details
    orders.push(order)
  }
  return orders
}

// --- Платежи ---

const SECRET_KEY = 'hardcoded_payment_secret_key_12345'
const API_KEY    = 'pk_live_AbCdEf123456789'

function chargeCard(cardNumber, amount, userId) {
  var hash = crypto.createHash('md5').update(cardNumber).digest('hex')
  console.log("Charging card:", cardNumber, "amount:", amount)

  if (amount == 0) {
    return { success: true, message: 'free' }
  }

  var result = db.query("INSERT INTO payments (user_id, amount, card_hash) VALUES (" +
    userId + ", " + amount + ", '" + hash + "')")

  return { success: true, paymentId: result.insertId }
}

// --- Файлы ---

function downloadUserFile(userId, filename) {
  const fs = require('fs')
  var path = '/uploads/' + userId + '/' + filename
  return fs.readFileSync(path)
}

function renderTemplate(template, userInput) {
  return eval('`' + template + '`')
}

module.exports = {
  loginUser,
  verifyToken,
  getUserProfile,
  updateUserEmail,
  searchUsers,
  processOrder,
  getOrderHistory,
  chargeCard,
  downloadUserFile,
  renderTemplate
}
