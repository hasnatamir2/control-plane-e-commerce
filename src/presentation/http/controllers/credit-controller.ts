import { Request, Response } from 'express'
import {
  GrantCreditUseCase,
  DeductCreditUseCase,
  GetBalanceUseCase,
  GetTransactionHistoryUseCase,
} from '@application/use-cases/credit'
import { GrantCreditDto, DeductCreditDto } from '@application/dtos/credit-dto'
import { Logger } from '@shared/utils/logger'

/**
 * Credit Controller
 * Handles HTTP requests for credit management operations
 * Converts HTTP requests to DTOs and returns only necessary data
 */
export class CreditController {
  constructor(
    private readonly grantCreditUseCase: GrantCreditUseCase,
    private readonly deductCreditUseCase: DeductCreditUseCase,
    private readonly getBalanceUseCase: GetBalanceUseCase,
    private readonly getTransactionHistoryUseCase: GetTransactionHistoryUseCase
  ) {}

  /**
   * POST /api/credits/grant
   * Grant credit to a customer
   */
  async grantCredit(req: Request, res: Response): Promise<Response> {
    Logger.info('Grant credit request', { body: req.body })

    // Convert request to DTO
    const dto: GrantCreditDto = {
      customerId: req.body.customerId,
      amount: req.body.amount,
      reason: req.body.reason,
      createdBy: req.body.createdBy,
      metadata: req.body.metadata,
    }

    const result = await this.grantCreditUseCase.execute(dto)

    // Return only necessary data
    return res.status(200).json({
      success: true,
      data: {
        customerId: result.customerId,
        previousBalance: result.previousBalance,
        newBalance: result.newBalance,
        transactionId: result.transactionId,
        timestamp: result.timestamp,
      },
    })
  }

  /**
   * POST /api/credits/deduct
   * Deduct credit from a customer
   */
  async deductCredit(req: Request, res: Response): Promise<Response> {
    Logger.info('Deduct credit request', { body: req.body })

    // Convert request to DTO
    const dto: DeductCreditDto = {
      customerId: req.body.customerId,
      amount: req.body.amount,
      reason: req.body.reason,
      createdBy: req.body.createdBy,
      metadata: req.body.metadata,
    }

    const result = await this.deductCreditUseCase.execute(dto)

    return res.status(200).json({
      success: true,
      data: {
        customerId: result.customerId,
        previousBalance: result.previousBalance,
        newBalance: result.newBalance,
        transactionId: result.transactionId,
        timestamp: result.timestamp,
      },
    })
  }

  /**
   * GET /api/credits/balance/:customerId
   * Get customer's credit balance
   */
  async getBalance(req: Request, res: Response): Promise<Response> {
    Logger.info('Get balance request', { customerId: req.params.customerId })

    const result = await this.getBalanceUseCase.execute({
      customerId: req.params.customerId as string,
    })

    // Return only balance data (DTO)
    return res.status(200).json({
      success: true,
      data: {
        customerId: result.customerId,
        currentBalance: result.currentBalance,
        lastUpdated: result.lastUpdated,
      },
    })
  }

  /**
   * GET /api/credits/transactions/:customerId
   * Get customer's credit transaction history
   */
  async getTransactionHistory(req: Request, res: Response): Promise<Response> {
    Logger.info('Get transaction history request', {
      customerId: req.params.customerId,
      query: req.query,
    })

    const result = await this.getTransactionHistoryUseCase.execute({
      customerId: req.params.customerId as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    })

    // Return transaction DTOs
    return res.status(200).json({
      success: true,
      data: {
        customerId: result.customerId,
        transactions: result.transactions,
        pagination: {
          limit: result.pagination.limit,
          offset: result.pagination.offset,
        },
      },
    })
  }
}
