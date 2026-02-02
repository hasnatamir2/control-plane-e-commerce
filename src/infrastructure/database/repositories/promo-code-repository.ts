import { PrismaClient } from '@prisma/client'
import { PromoCode, PromoCodeStatus, PromoCodeType } from '@domain/entities/promo-code'
import { IPromoCodeRepository, PromoCodeFilters } from '@domain/repositories/ipromo-code-repository'

export class PromoCodeRepository implements IPromoCodeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(promoCode: PromoCode): Promise<PromoCode> {
    const data = await this.prisma.promoCode.create({
      data: {
        id: promoCode.id,
        code: promoCode.code,
        type: promoCode.type,
        value: promoCode.value,
        minPurchaseAmount: promoCode.minPurchaseAmount,
        maxDiscountAmount: promoCode.maxDiscountAmount,
        maxUsageCount: promoCode.maxUsageCount,
        currentUsageCount: promoCode.currentUsageCount,
        validFrom: promoCode.validFrom,
        validUntil: promoCode.validUntil,
        status: promoCode.status,
        applicableProductIds: promoCode.applicableProductIds,
      },
    })

    return this.toDomain(data)
  }

  async findByCode(code: string): Promise<PromoCode | null> {
    const data = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    })

    return data ? this.toDomain(data) : null
  }

  async findById(id: string): Promise<PromoCode | null> {
    const data = await this.prisma.promoCode.findUnique({
      where: { id },
    })

    return data ? this.toDomain(data) : null
  }

  async findAll(filters?: PromoCodeFilters): Promise<PromoCode[]> {
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.isActive) {
      where.status = PromoCodeStatus.ACTIVE
    }

    const data = await this.prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return data.map((d) => this.toDomain(d))
  }

  async update(promoCode: PromoCode): Promise<PromoCode> {
    const data = await this.prisma.promoCode.update({
      where: { id: promoCode.id },
      data: {
        currentUsageCount: promoCode.currentUsageCount,
        status: promoCode.status,
        updatedAt: promoCode.updatedAt,
      },
    })

    return this.toDomain(data)
  }

  async count(filters?: PromoCodeFilters): Promise<number> {
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }

    return await this.prisma.promoCode.count({ where })
  }

  async recordUsage(
    promoCodeId: string,
    customerId: string,
    purchaseId: string,
    discountAmount: number
  ): Promise<void> {
    await this.prisma.promoCodeUsage.create({
      data: {
        promoCodeId,
        customerId,
        purchaseId,
        discountAmount,
      },
    })
  }

  private toDomain(data: any): PromoCode {
    return PromoCode.reconstitute({
      id: data.id,
      code: data.code,
      type: data.type as PromoCodeType,
      value: Number(data.value),
      minPurchaseAmount: data.minPurchaseAmount ? Number(data.minPurchaseAmount) : undefined,
      maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : undefined,
      maxUsageCount: data.maxUsageCount || undefined,
      currentUsageCount: data.currentUsageCount,
      validFrom: new Date(data.validFrom),
      validUntil: new Date(data.validUntil),
      status: data.status as PromoCodeStatus,
      applicableProductIds: data.applicableProductIds
        ? JSON.parse(JSON.stringify(data.applicableProductIds))
        : undefined,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    })
  }
}
