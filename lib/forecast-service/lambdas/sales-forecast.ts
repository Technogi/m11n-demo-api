import { APIGatewayProxyHandler } from "aws-lambda";
import { ForecastQueryService } from "aws-sdk";

const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
  "Access-Control-Allow-Methods": 'GET',
}

const forecastQuery = new ForecastQueryService()

export const handler: APIGatewayProxyHandler = async request => {
  const {
    s = "2023-02-14T00:00:00",
    e = "2023-02-21T00:00:00",
    m = 'daily'
  } = request?.queryStringParameters || {}

  const forecastArn = m === 'daily' ? process.env.DAILY_FORECAST_ARN : process.env.MONTHLY_FORECAST_ARN
  try {
    const forecast = await forecastQuery
      .queryForecast({
        ForecastArn: forecastArn!,
        StartDate: s,
        EndDate: e,
        Filters: { item_id: request?.pathParameters?.id || '' },
      })
      .promise();

    return {
      body: JSON.stringify(forecast.Forecast?.Predictions || []),
      statusCode: 200,
      headers: responseHeaders
    }
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ e, request }),
      headers: responseHeaders
    }
  }
}