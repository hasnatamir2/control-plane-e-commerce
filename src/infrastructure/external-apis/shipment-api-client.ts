import {
  CreateShipmentRequest,
  CreateShipmentResponse,
  ApiError,
} from '@shared/types/external-api.types'

export interface IShipmentApiClient {
  createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse>
}

export class ShipmentApiClient implements IShipmentApiClient {
  private readonly baseUrl: string

  constructor(
    baseUrl: string = process.env.SHIPMENT_API_URL || 'http://localhost:3001/api/shipments'
  ) {
    this.baseUrl = baseUrl
  }

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = (await response.json()) as ApiError
        throw new Error(error.Message || `Failed to create shipment: ${response.statusText}`)
      }

      const result = (await response.json()) as CreateShipmentResponse
      return result
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Shipment API Error: ${error.message}`)
      }
      throw new Error('Shipment API Error: Unknown error occurred')
    }
  }
}
