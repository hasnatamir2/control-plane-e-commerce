import { Request, Response } from 'express'
import {
  CreatePurchaseUseCase,
  ListPurchasesUseCase,
  GetPurchaseUseCase,
  RefundPurchaseUseCase,
} from '@application/use-cases/purchase'
import { CreatePurchaseDto, RefundPurchaseDto } from '@application/dtos/purchase-dto'
import { Logger } from '@shared/utils/logger'

/**
 * Purchase Controller
 * Handles HTTP requests for purchase operations
 * Converts HTTP requests to DTOs and returns only necessary data
 */
export class PurchaseController {
  constructor(
    private readonly createPurchaseUseCase: CreatePurchaseUseCase,
    private readonly listPurchasesUseCase: ListPurchasesUseCase,
    private readonly getPurchaseUseCase: GetPurchaseUseCase,
    private readonly refundPurchaseUseCase: RefundPurchaseUseCase
  ) {}

  /**
   * POST /api/purchases
   * Create a new purchase
   */
  async createPurchase(req: Request, res: Response): Promise<Response> {
    Logger.info('Create purchase request', { body: req.body })

    // Convert request to DTO
    const dto: CreatePurchaseDto = {
      customerId: req.body.customerId,
      productId: req.body.productId,
      quantity: req.body.quantity,
      createdBy: req.body.createdBy,
    }

    const result = await this.createPurchaseUseCase.execute(dto)

    return res.status(201).json({
      success: true,
      data: result,
    })
  }

  /**
   * GET /api/purchases
   * List all purchases with optional filtering
   */
  async listPurchases(req: Request, res: Response): Promise<Response> {
    Logger.info('List purchases request', { query: req.query })

    const result = await this.listPurchasesUseCase.execute({
      customerId: req.query.customerId as string | undefined,
      status: req.query.status as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    })

    return res.status(200).json({
      success: true,
      data: result,
    })
  }

  /**
   * GET /api/purchases/:purchaseId
   * Get a single purchase by ID
   */
  async getPurchase(req: Request, res: Response): Promise<Response> {
    Logger.info('Get purchase request', { purchaseId: req.params.purchaseId })

    const result = await this.getPurchaseUseCase.execute({
      purchaseId: req.params.purchaseId as string,
    })

    return res.status(200).json({
      success: true,
      data: result,
    })
  }

  /**
   * GET /api/purchases/customer/:customerId
   * Get all purchases for a specific customer
   */
  async getCustomerPurchases(req: Request, res: Response): Promise<Response> {
    Logger.info('Get customer purchases request', {
      customerId: req.params.customerId,
      query: req.query,
    })

    const result = await this.listPurchasesUseCase.execute({
      customerId: req.params.customerId as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    })

    return res.status(200).json({
      success: true,
      data: result,
    })
  }

  /**
   * POST /api/purchases/:purchaseId/refund
   * Refund a purchase (full or partial)
   */
  async refundPurchase(req: Request, res: Response): Promise<Response> {
    Logger.info('Refund purchase request', {
      purchaseId: req.params.purchaseId,
      body: req.body,
    })

    // Convert request to DTO
    const dto: RefundPurchaseDto = {
      purchaseId: req.params.purchaseId as string,
      amount: req.body.amount,
      reason: req.body.reason,
      refundedBy: req.body.refundedBy,
    }

    const result = await this.refundPurchaseUseCase.execute(dto)

    return res.status(200).json({
      success: true,
      data: result,
    })
  }
}
