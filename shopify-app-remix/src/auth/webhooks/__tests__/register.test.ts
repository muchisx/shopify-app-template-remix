import { Session } from "@shopify/shopify-api";

import { DeliveryMethod, shopifyApp } from "../../..";
import { TEST_SHOP, testConfig } from "../../../__tests__/test-helper";

import * as mockResponses from "./mock-responses";
import { mockShopifyRequests } from "../../../__tests__/request-mock";

describe("Webhook registration", () => {
  it("registers webhooks", async () => {
    // GIVEN
    const shopify = shopifyApp(
      testConfig({
        webhooks: {
          PRODUCTS_CREATE: {
            deliveryMethod: DeliveryMethod.Http,
            callbackUrl: "/webhooks",
          },
        },
      })
    );
    const session = new Session({
      id: `offline_${TEST_SHOP}`,
      shop: TEST_SHOP,
      isOnline: false,
      state: "test",
      accessToken: "totally_real_token",
    });

    mockShopifyRequests(
      {
        request: { body: expect.stringContaining("webhookSubscriptions") },
        response: { body: mockResponses.EMPTY_WEBHOOK_RESPONSE },
      },
      {
        request: { body: expect.stringContaining("webhookSubscriptionCreate") },
        response: { body: mockResponses.HTTP_WEBHOOK_CREATE_RESPONSE },
      }
    );

    // WHEN
    const results = await shopify.registerWebhooks({ session });

    // THEN
    expect(results).toMatchObject({
      PRODUCTS_CREATE: [expect.objectContaining({ success: true })],
    });
  });

  it("logs when registration fails", async () => {
    // GIVEN
    const shopify = shopifyApp(
      testConfig({
        webhooks: {
          NOT_A_VALID_TOPIC: {
            deliveryMethod: DeliveryMethod.Http,
            callbackUrl: "/webhooks",
          },
        },
      })
    );
    const session = new Session({
      id: `offline_${TEST_SHOP}`,
      shop: TEST_SHOP,
      isOnline: false,
      state: "test",
      accessToken: "totally_real_token",
    });

    mockShopifyRequests(
      {
        request: { body: expect.stringContaining("webhookSubscriptions") },
        response: { body: mockResponses.EMPTY_WEBHOOK_RESPONSE },
      },
      {
        request: { body: expect.stringContaining("webhookSubscriptionCreate") },
        response: { body: mockResponses.HTTP_WEBHOOK_CREATE_ERROR_RESPONSE },
      }
    );

    // WHEN
    const results = await shopify.registerWebhooks({ session });

    // THEN
    expect(results).toMatchObject({
      NOT_A_VALID_TOPIC: [expect.objectContaining({ success: false })],
    });
  });
});
