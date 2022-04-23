const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json())

const customers = []

// Middleware
function verifyIfExistsAccountCPF(req, res, next) {
  const { cpf } = req.headers
  // faz uma busca para encontrar o cpf enviado
  const customer = customers.find(customer => customer.cpf === cpf)
  // se nao tiver nenhum cpf retorna o erro abaixo
  if (!customer) {
    return res.status(400).json({ error: 'Customer not found' })
  }
  // todos as rotas que chamarem esse middlewar ira herdar essa variavel abaixo para ser usada nas rotas
  req.customer = customer

  return next()
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount
    } else {
      return acc - operation.amount
    }
  }, 0)
  return balance
}

// criar usuario
app.post('/account', (req, res) => {
  const { cpf, name } = req.body

  // verificar se o cpf ja existe
  const customerAlreadyEists = customers.some(customer => customer.cpf === cpf)
  // se o cpf ja existir retorna um erro em formato JSON
  if (customerAlreadyEists) {
    return res.status(400).json({ error: 'Customer already exists' })
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  })

  return res.status(201).send()
})

app.get('/statement', verifyIfExistsAccountCPF, (req, res) => {
  //abaixo a variavel customer pega a informacao passada do middlewer
  const { customer } = req
  return res.json(customer.statement)
})

app.post('/deposit', verifyIfExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body

  const { customer } = req

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit',
  }

  customer.statement.push(statementOperation)

  return res.status(201).send()
})

app.post('/withdraw', verifyIfExistsAccountCPF, (req, res) => {
  const { amount } = req.body
  const { customer } = req

  const balance = getBalance(customer.statement)

  if (balance < amount) {
    return res.status(400).json({ error: 'Insufficient funds!' })
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit',
  }
  customer.statement.push(statementOperation)

  return res.status(201).send()
})

// para fazer uma busca usando a Data
app.get('/statement/date', verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req
  const { date } = req.query

  const dateFormat = new Date(date)

  console.log(dateFormat)

  const statement = customer.statement.filter(
    statement =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  )

  return res.json(statement)
})

// atualizar o nome de uzuario
app.put('/account', verifyIfExistsAccountCPF, (req, res) => {
  const { name } = req.body
  const { customer } = req

  customer.name = name

  return res.status(201).send()
})

// para vizualizar todos os dados da conta
app.get('/account', verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req

  return res.json(customer)
})

app.delete('/account', verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req

  customers.splice(customer, 1)

  return res.status(200).json(customers)
})

app.get('/balance', verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req

  const balance = getBalance(customer.statement)

  return res.json(balance)
})

app.listen(3333)
