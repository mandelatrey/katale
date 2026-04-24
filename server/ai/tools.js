// Tool surface for the WhatsApp AI middleware.
//
// Each entry has:
//   definition: tool schema in Anthropic format (name, description, input_schema)
//   handler:    async (input, ctx) => any
//
// Gemini-compatible declarations are derived automatically via
// toGeminiSchema() and exported as geminiToolDeclarations.
//
// `ctx` matches the agent's call context: { actor, user, message, session }.
// Handlers translate between the LLM's tool inputs and the existing
// server/services/* functions, which are already Zod-validated and
// actor-aware. Handlers are also where we apply WhatsApp-specific
// authorization (e.g. update_carrier_status only touches the sender's
// linked carrier).

import {
  listLatestPrices,
  getPriceHistory,
  comparePrices,
  getTransportEstimate,
} from "../services/commodities.js";
import {
  listMarkets,
  listNearbyMarkets,
  getMarketById,
} from "../services/markets.js";
import { listPayments } from "../services/payments.js";
import {
  listCarriers,
  updateCarrier,
  getCarrierById,
} from "../services/carriers.js";
import { listAssets } from "../services/assets.js";
import {
  listTransactions,
  updateTransaction,
  getTransactionById,
  createTransaction,
} from "../services/transactions.js";
import { listStatements } from "../services/statements.js";
import { listReports } from "../services/reports.js";
import { listInsights } from "../services/insights.js";

const OBJECT_ID_PATTERN = "^[a-fA-F0-9]{24}$";

function requireUser(ctx, action) {
  if (!ctx.user) {
    const err = new Error(
      `Sender is not registered. ${action} requires a registered user.`,
    );
    err.code = "not_registered";
    throw err;
  }
  return ctx.user;
}

const TOOLS = [
  {
    definition: {
      name: "list_latest_prices",
      description:
        "Latest recorded price per market for a commodity. Use this for 'what's the price of X' or 'price of X today'. If commodity is omitted, returns latest prices across all commodities (one row per market).",
      input_schema: {
        type: "object",
        properties: {
          commodity: {
            type: "string",
            description: "Commodity name, e.g. 'maize', 'beans', 'coffee'.",
          },
          market_id: {
            type: "string",
            pattern: OBJECT_ID_PATTERN,
            description: "Optional market ObjectId to filter to one market.",
          },
        },
      },
    },
    handler: (input, ctx) =>
      listLatestPrices(
        { commodity: input.commodity, marketId: input.market_id },
        ctx.actor,
      ),
  },

  {
    definition: {
      name: "get_price_history",
      description:
        "Daily aggregated price history (avg/min/max) for a commodity over the last N days. Use for trends like 'how has maize moved this month'.",
      input_schema: {
        type: "object",
        properties: {
          commodity: { type: "string" },
          days: {
            type: "integer",
            minimum: 1,
            maximum: 365,
            description: "Lookback window in days. Defaults to 30.",
          },
          market_id: {
            type: "string",
            pattern: OBJECT_ID_PATTERN,
          },
        },
        required: ["commodity"],
      },
    },
    handler: (input, ctx) =>
      getPriceHistory(
        {
          commodity: input.commodity,
          days: input.days ?? 30,
          marketId: input.market_id,
        },
        ctx.actor,
      ),
  },

  {
    definition: {
      name: "compare_prices",
      description:
        "Latest price for a commodity across all markets in the last 7 days, sorted cheapest first. Use for 'where can I buy X cheapest'.",
      input_schema: {
        type: "object",
        properties: { commodity: { type: "string" } },
        required: ["commodity"],
      },
    },
    handler: (input, ctx) =>
      comparePrices({ commodity: input.commodity }, ctx.actor),
  },

  {
    definition: {
      name: "get_transport_estimate",
      description:
        "Distance, travel time, and estimated cost (UGX) of moving goods between two markets. Both ids are 24-char Mongo ObjectIds.",
      input_schema: {
        type: "object",
        properties: {
          from_market_id: { type: "string", pattern: OBJECT_ID_PATTERN },
          to_market_id: { type: "string", pattern: OBJECT_ID_PATTERN },
        },
        required: ["from_market_id", "to_market_id"],
      },
    },
    handler: (input, ctx) =>
      getTransportEstimate(
        { fromId: input.from_market_id, toId: input.to_market_id },
        ctx.actor,
      ),
  },

  {
    definition: {
      name: "list_markets",
      description:
        "List markets, optionally filtered by region, district, or market type.",
      input_schema: {
        type: "object",
        properties: {
          region: { type: "string" },
          district: { type: "string" },
          market_type: {
            type: "string",
            enum: ["wholesale", "retail", "collection"],
          },
        },
      },
    },
    handler: (input, ctx) =>
      listMarkets(
        {
          region: input.region,
          district: input.district,
          marketType: input.market_type,
        },
        ctx.actor,
      ),
  },

  {
    definition: {
      name: "list_nearby_markets",
      description:
        "Up to 10 markets within a radius of a GPS coordinate. Use for 'markets near me' when the user supplies coordinates.",
      input_schema: {
        type: "object",
        properties: {
          lat: { type: "number", minimum: -90, maximum: 90 },
          lng: { type: "number", minimum: -180, maximum: 180 },
          max_distance_meters: {
            type: "number",
            minimum: 100,
            maximum: 500000,
            description: "Search radius in metres. Defaults to 50000 (50 km).",
          },
        },
        required: ["lat", "lng"],
      },
    },
    handler: (input, ctx) =>
      listNearbyMarkets(
        {
          lat: input.lat,
          lng: input.lng,
          maxDistance: input.max_distance_meters ?? 50000,
        },
        ctx.actor,
      ),
  },

  {
    definition: {
      name: "get_market",
      description: "Fetch one market document by ObjectId.",
      input_schema: {
        type: "object",
        properties: {
          market_id: { type: "string", pattern: OBJECT_ID_PATTERN },
        },
        required: ["market_id"],
      },
    },
    handler: (input, ctx) =>
      getMarketById({ id: input.market_id }, ctx.actor),
  },

  {
    definition: {
      name: "list_payments",
      description:
        "List payment records, optionally filtered by status or method. Use for 'pending payments' or 'paid via mobile money'.",
      input_schema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["pending", "completed", "failed", "refunded"],
          },
          method: {
            type: "string",
            enum: ["mobile_money", "bank_transfer", "cash", "cheque"],
          },
          limit: { type: "integer", minimum: 1, maximum: 50 },
        },
      },
    },
    handler: (input, ctx) =>
      listPayments(
        {
          status: input.status,
          method: input.method,
          limit: input.limit ?? 10,
        },
        ctx.actor,
      ),
  },

  {
    definition: {
      name: "list_carriers",
      description:
        "List carrier vehicles in the fleet, optionally filtered by status, category, or name search.",
      input_schema: {
        type: "object",
        properties: {
          search: { type: "string" },
          category: {
            type: "string",
            enum: ["Favorites", "Trucks", "Vans"],
          },
          status: {
            type: "string",
            enum: ["ON THE WAY", "LOADING", "WAITING", "UNLOADING"],
          },
        },
      },
    },
    handler: (input, ctx) =>
      listCarriers(
        {
          search: input.search,
          category: input.category,
          status: input.status,
        },
        ctx.actor,
      ),
  },

  {
    definition: {
      name: "get_my_carrier",
      description:
        "Fetch the carrier vehicle linked to the sender's account. Returns null if they aren't linked to one.",
      input_schema: { type: "object", properties: {} },
    },
    handler: async (_input, ctx) => {
      const user = requireUser(ctx, "get_my_carrier");
      if (!user.carrier) return null;
      return getCarrierById({ id: user.carrier.toString() }, ctx.actor);
    },
  },

  {
    definition: {
      name: "update_carrier_status",
      description:
        "Update the status of the sender's linked carrier vehicle. Always targets the sender's own carrier — do not pass an id.",
      input_schema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["ON THE WAY", "LOADING", "WAITING", "UNLOADING"],
          },
        },
        required: ["status"],
      },
    },
    handler: async (input, ctx) => {
      const user = requireUser(ctx, "update_carrier_status");
      if (!user.carrier) {
        const err = new Error(
          "Your account isn't linked to a carrier vehicle. Ask staff to link one.",
        );
        err.code = "no_linked_carrier";
        throw err;
      }
      return updateCarrier(
        { id: user.carrier.toString(), status: input.status },
        ctx.actor,
      );
    },
  },

  {
    definition: {
      name: "list_assets",
      description:
        "List assets (warehouses, vehicles, equipment), optionally filtered.",
      input_schema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["vehicle", "warehouse", "equipment"],
          },
          status: {
            type: "string",
            enum: ["active", "maintenance", "idle", "decommissioned"],
          },
          region: { type: "string" },
        },
      },
    },
    handler: (input, ctx) =>
      listAssets(
        {
          type: input.type,
          status: input.status,
          region: input.region,
        },
        ctx.actor,
      ),
  },

  {
    definition: {
      name: "list_transactions",
      description:
        "List transactions (orders), optionally filtered by commodity, status, or buy/sell type.",
      input_schema: {
        type: "object",
        properties: {
          commodity: { type: "string" },
          status: {
            type: "string",
            enum: [
              "pending",
              "confirmed",
              "in_transit",
              "delivered",
              "cancelled",
            ],
          },
          type: { type: "string", enum: ["buy", "sell"] },
          limit: { type: "integer", minimum: 1, maximum: 50 },
        },
      },
    },
    handler: (input, ctx) =>
      listTransactions(
        {
          commodity: input.commodity,
          status: input.status,
          type: input.type,
          limit: input.limit ?? 10,
        },
        ctx.actor,
      ),
  },

  {
    definition: {
      name: "get_transaction",
      description:
        "Fetch one transaction by 24-char Mongo ObjectId. Use when the user references a specific order.",
      input_schema: {
        type: "object",
        properties: {
          transaction_id: { type: "string", pattern: OBJECT_ID_PATTERN },
        },
        required: ["transaction_id"],
      },
    },
    handler: (input, ctx) =>
      getTransactionById({ id: input.transaction_id }, ctx.actor),
  },

  {
    definition: {
      name: "update_transaction",
      description:
        "Update a transaction's status or fields. Destructive — confirm with the user first. `transaction_id` is the 24-char Mongo ObjectId, NOT the human-readable TXN-XXXXX code.",
      input_schema: {
        type: "object",
        properties: {
          transaction_id: { type: "string", pattern: OBJECT_ID_PATTERN },
          status: {
            type: "string",
            enum: [
              "pending",
              "confirmed",
              "in_transit",
              "delivered",
              "cancelled",
            ],
          },
          notes: { type: "string", maxLength: 2000 },
        },
        required: ["transaction_id"],
      },
    },
    handler: async (input, ctx) => {
      requireUser(ctx, "update_transaction");
      const { transaction_id, ...rest } = input;
      return updateTransaction({ id: transaction_id, ...rest }, ctx.actor);
    },
  },

  {
    definition: {
      name: "create_transaction",
      description:
        "Create a new buy or sell transaction. Destructive — gather all required fields and read them back to the user for confirmation BEFORE calling this tool.",
      input_schema: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["buy", "sell"] },
          commodity: { type: "string" },
          quantity: { type: "number", exclusiveMinimum: 0 },
          unit_price: { type: "number", exclusiveMinimum: 0 },
          currency: { type: "string", description: "Defaults to UGX." },
          from_market_id: { type: "string", pattern: OBJECT_ID_PATTERN },
          to_market_id: { type: "string", pattern: OBJECT_ID_PATTERN },
          buyer: { type: "string" },
          seller: { type: "string" },
          notes: { type: "string", maxLength: 2000 },
          payment_method: {
            type: "string",
            enum: ["mobile_money", "bank_transfer", "cash", "cheque"],
          },
        },
        required: ["type", "commodity", "quantity", "unit_price"],
      },
    },
    handler: async (input, ctx) => {
      requireUser(ctx, "create_transaction");
      return createTransaction(
        {
          type: input.type,
          commodity: input.commodity,
          quantity: input.quantity,
          unitPrice: input.unit_price,
          currency: input.currency ?? "UGX",
          fromMarket: input.from_market_id,
          toMarket: input.to_market_id,
          buyer: input.buyer,
          seller: input.seller,
          notes: input.notes,
          paymentMethod: input.payment_method,
        },
        ctx.actor,
      );
    },
  },

  {
    definition: {
      name: "list_statements",
      description:
        "List the most recent financial statements (account summaries). Default limit 5.",
      input_schema: {
        type: "object",
        properties: {
          limit: { type: "integer", minimum: 1, maximum: 60 },
        },
      },
    },
    handler: (input, ctx) =>
      listStatements({ limit: input.limit ?? 5 }, ctx.actor),
  },

  {
    definition: {
      name: "list_reports",
      description:
        "List market reports (price trends, trade volume, market activity, regional summaries).",
      input_schema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: [
              "price_trend",
              "trade_volume",
              "market_activity",
              "regional_summary",
            ],
          },
          region: { type: "string" },
          limit: { type: "integer", minimum: 1, maximum: 50 },
        },
      },
    },
    handler: (input, ctx) =>
      listReports(
        {
          type: input.type,
          region: input.region,
          limit: input.limit ?? 10,
        },
        ctx.actor,
      ),
  },

  {
    definition: {
      name: "list_insights",
      description:
        "List short market insight cards used on the dashboard. Useful for 'what's happening in the market'.",
      input_schema: { type: "object", properties: {} },
    },
    handler: (_input, ctx) => listInsights({}, ctx.actor),
  },
];

export const toolDefinitions = TOOLS.map((t) => t.definition);

// Gemini uses uppercase type names and a subset of JSON Schema fields.
const GEMINI_TYPE = {
  string: "STRING",
  integer: "INTEGER",
  number: "NUMBER",
  boolean: "BOOLEAN",
  array: "ARRAY",
  object: "OBJECT",
};

function toGeminiSchema(schema) {
  if (!schema || typeof schema !== "object") return undefined;
  const out = {};
  if (schema.type) out.type = GEMINI_TYPE[schema.type] ?? schema.type.toUpperCase();
  if (schema.description) out.description = schema.description;
  if (schema.enum) out.enum = schema.enum;
  if (schema.required?.length) out.required = schema.required;
  if (schema.items) out.items = toGeminiSchema(schema.items);
  if (schema.properties) {
    const entries = Object.entries(schema.properties);
    if (entries.length > 0) {
      out.properties = Object.fromEntries(
        entries.map(([k, v]) => [k, toGeminiSchema(v)]),
      );
    }
  }
  return out;
}

// Single Tool object expected by the Gemini SDK (one functionDeclarations array).
export const geminiToolDeclarations = [
  {
    functionDeclarations: TOOLS.map((t) => {
      const decl = { name: t.definition.name, description: t.definition.description };
      const params = toGeminiSchema(t.definition.input_schema);
      // Only attach parameters when there are actual properties to describe.
      if (params?.properties || params?.required) decl.parameters = params;
      return decl;
    }),
  },
];

const handlerMap = Object.fromEntries(
  TOOLS.map((t) => [t.definition.name, t.handler]),
);

export async function executeTool(name, input, ctx) {
  const handler = handlerMap[name];
  if (!handler) {
    const err = new Error(`Unknown tool: ${name}`);
    err.code = "unknown_tool";
    throw err;
  }
  return handler(input ?? {}, ctx);
}
