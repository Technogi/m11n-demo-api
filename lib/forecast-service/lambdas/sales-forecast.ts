import { APIGatewayProxyHandler } from "aws-lambda";
import { ForecastQueryService } from "aws-sdk";

const forecastQuery = new ForecastQueryService()

export const handler: APIGatewayProxyHandler = async request => {
  try {
    const forecast = await forecastQuery
      .queryForecast({
        ForecastArn: process.env.FORECAST_ARN || '',
        StartDate: request.queryStringParameters?.s || "2023-02-14T00:00:00",
        EndDate: request.queryStringParameters?.e || "2023-02-21T00:00:00",
        Filters: { item_id: request?.pathParameters?.id || '' },
      })
      .promise();
    return {
      body: JSON.stringify(forecast.Forecast?.Predictions || []),
      statusCode: 200
    }
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ e, request })
    }
  }
}