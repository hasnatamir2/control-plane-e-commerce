import { Product, ApiError } from '@shared/types/external-api.types'

export interface IProductApiClient {
  getProduct(productId: string): Promise<Product>
}

export class ProductApiClient implements IProductApiClient {
  private readonly baseUrl: string

  constructor(
    baseUrl: string = process.env.PRODUCT_API_URL || 'http://localhost:3001/api/products'
  ) {
    this.baseUrl = baseUrl
  }

  async getProduct(productId: string): Promise<Product> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = (await response.json()) as ApiError
        throw new Error(error.Message || `Failed to fetch product: ${response.statusText}`)
      }

      const product = (await response.json()) as Product
      return product
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Product API Error: ${error.message}`)
      }
      throw new Error('Product API Error: Unknown error occurred')
    }
  }
}
