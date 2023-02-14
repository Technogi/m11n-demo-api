import { APIGatewayProxyHandler } from "aws-lambda";
import { ForecastQueryService } from "aws-sdk";

const forecastQuery = new ForecastQueryService()

export const handler: APIGatewayProxyHandler = async (request) => {
  console.log('Got request for:', request.path)
  console.log('Got request for Q:', request.queryStringParameters)
  try {
    const forecast = await forecastQuery
      .queryForecast({
        ForecastArn: process.env.FORECAST_ARN || '',
        StartDate: "2023-02-14T00:00:00",
        EndDate: "2023-02-21T00:00:00",
        Filters: { item_id: "15" },
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