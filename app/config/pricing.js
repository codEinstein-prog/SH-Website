/*
 * IMPORTANT:
 * These are demonstration prices only.
 *
 * Replace every value with pricing approved by the client
 * before making the quotation calculator publicly available.
 */

export const pricingConfig = {
  currency: "USD",
  currencySymbol: "$",

  estimateRange: {
    lowerPercentage: 0.88,
    upperPercentage: 1.15
  },

  complexityLevels: [
    {
      label: "Straightforward",
      value: "straightforward",
      multiplier: 0.95
    },
    {
      label: "Standard",
      value: "standard",
      multiplier: 1
    },
    {
      label: "Complex",
      value: "complex",
      multiplier: 1.2
    }
  ],

  services: {
    Roofing: {
      basePrice: 3500,
      unitRate: 8.5,
      unitLabel: "Estimated roof area",
      unitSuffix: "sq. ft.",
      defaultQuantity: 1500,
      minimumQuantity: 300,
      maximumQuantity: 10000,

      extras: [
        {
          id: "roof-removal",
          label: "Existing roof removal",
          price: 2500
        },
        {
          id: "structural-review",
          label: "Structural review allowance",
          price: 1500
        }
      ]
    },

    Solar: {
      basePrice: 4500,

      installationPricing: {
        averageCostPerWatt: 2.60,
        averageCostPerKW: 2600
      },

      systemCosts: [
        { size: 5, averageCost: 13000 },
        { size: 8, averageCost: 20800 },
        { size: 10, averageCost: 26000 },
        { size: 12, averageCost: 31200 },
        { size: 15, averageCost: 39000 },
        { size: 20, averageCost: 52000 },
        { size: 25, averageCost: 65000 },
        { size: 30, averageCost: 78000 },
        { size: 40, averageCost: 104000 },
        { size: 50, averageCost: 130000 }
      ],

      extras: [
        {
          id: "battery-storage",
          label: "Battery-storage allowance",
          price: 9000
        },
        {
          id: "electrical-upgrade",
          label: "Electrical-upgrade allowance",
          price: 2500
        }
      ]
    },

    "Impact windows": {
      basePrice: 2500,
      unitRate: 1400,
      unitLabel: "Number of windows",
      unitSuffix: "windows",
      defaultQuantity: 6,
      minimumQuantity: 1,
      maximumQuantity: 100,

      extras: [
        {
          id: "impact-doors",
          label: "Impact-door allowance",
          price: 3500
        },
        {
          id: "custom-sizing",
          label: "Custom sizing allowance",
          price: 2000
        }
      ]
    }
  }
};