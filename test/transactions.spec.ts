import { test, beforeAll, afterAll, describe, it, expect, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import { createServer } from 'node:http'
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions routes', () => {
    beforeAll(async () => {
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(() => {
        // execSync('npm run knex migrate:rollback --all')
        execSync('npm run knex migrate:latest')
    })

    it('O usuario consegue criar uma nova transação', async () => {

        const response = await request(app.server)
            .post('/transactions')
            .send({
                "title": "New transaction",
                "amount": 5000,
                "type": 'credit'
            })
            .expect(201)

    })

    it('O usuario consegue listar todas as transações', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                "title": "New transaction",
                "amount": 5000,
                "type": 'credit'
            })

        const cookies = createTransactionResponse.get('Set-Cookie')

        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200)

        expect(listTransactionsResponse.body.transactions).toEqual([
            expect.objectContaining({
                title: 'New transaction',
                amount: 5000,
            }),
        ])
    })

    it('O usuario consegue listar uma transação específica', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                "title": "New transaction",
                "amount": 5000,
                "type": 'credit'
            })

        const cookies = createTransactionResponse.get('Set-Cookie')

        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200)

        const transactionId = listTransactionsResponse.body.transactions[0].id

        const getTransactionResponse = await request(app.server)
            .get(`/transactions/${transactionId}`)
            .set('Cookie', cookies)
            .expect(200)

        expect(getTransactionResponse.body.transaction).toEqual(
            expect.objectContaining({
                title: 'New transaction',
                amount: 5000,
            }),
        )
    })

    it('O usuario consegue obter o resumo das transações', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                "title": "New transaction",
                "amount": 5000,
                "type": 'credit'
            })

        const cookies = createTransactionResponse.get('Set-Cookie')

        await request(app.server)
            .post('/transactions')
            .set('Cookie', cookies)
            .send({
                "title": "Debit transaction",
                "amount": 2000,
                "type": 'debit'
            })


        const summaryResponse = await request(app.server)
            .get('/transactions/summary')
            .set('Cookie', cookies)
            .expect(200)

        expect(summaryResponse.body.summary).toEqual({
            amount: 3000,
        })
    })
})

