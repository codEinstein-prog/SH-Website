import { useMemo, useState } from "react";
import {
  Calculator,
  Check,
  Info,
  Printer,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Sun,
  Zap,
  BatteryCharging,
} from "lucide-react";

import ContentSection from "/components/ContentSection";
import PageHero from "/components/PageHero";
import PrimaryButton from "/components/PrimaryButton";
import { pricingConfig } from "/app/config/pricing";

/*
 * EstimatePage
 *
 * Refactored to support:
 * - Normal project estimating for every configured service.
 * - Solar-specific financial modelling.
 * - State-based residential electricity rates.
 * - Estimated system cost by solar system size.
 * - Annual utility-rate inflation.
 * - Monthly grid export/sell-back income.
 * - Solar offset percentage.
 * - Annual savings and cumulative savings.
 * - Simple payback calculation.
 * - 25-year projection.
 * - Solar ROI calculation.
 *
 * IMPORTANT:
 * The electricity rates below are based on the EIA table supplied for
 * this project. Update the data when a new EIA release is adopted.
 */

const EIA_RATE_VERSION = "2026 July YTD";

const electricityRates = [
  { state: "Alabama", code: "AL", residentialRate: 16.54 },
  { state: "Alaska", code: "AK", residentialRate: 27.09 },
  { state: "Arizona", code: "AZ", residentialRate: 15.44 },
  { state: "Arkansas", code: "AR", residentialRate: 13.61 },
  { state: "California", code: "CA", residentialRate: 33.25 },
  { state: "Colorado", code: "CO", residentialRate: 16.72 },
  { state: "Connecticut", code: "CT", residentialRate: 27.97 },
  { state: "Delaware", code: "DE", residentialRate: 17.86 },
  { state: "District of Columbia", code: "DC", residentialRate: 24.66 },
  { state: "Florida", code: "FL", residentialRate: 15.30 },
  { state: "Georgia", code: "GA", residentialRate: 15.40 },
  { state: "Hawaii", code: "HI", residentialRate: 37.58 },
  { state: "Idaho", code: "ID", residentialRate: 12.96 },
  { state: "Illinois", code: "IL", residentialRate: 19.22 },
  { state: "Indiana", code: "IN", residentialRate: 17.04 },
  { state: "Iowa", code: "IA", residentialRate: 14.20 },
  { state: "Kansas", code: "KS", residentialRate: 15.21 },
  { state: "Kentucky", code: "KY", residentialRate: 14.27 },
  { state: "Louisiana", code: "LA", residentialRate: 13.35 },
  { state: "Maine", code: "ME", residentialRate: 29.99 },
  { state: "Maryland", code: "MD", residentialRate: 21.30 },
  { state: "Massachusetts", code: "MA", residentialRate: 30.14 },
  { state: "Michigan", code: "MI", residentialRate: 21.53 },
  { state: "Minnesota", code: "MN", residentialRate: 16.25 },
  { state: "Mississippi", code: "MS", residentialRate: 15.19 },
  { state: "Missouri", code: "MO", residentialRate: 13.96 },
  { state: "Montana", code: "MT", residentialRate: 13.95 },
  { state: "Nebraska", code: "NE", residentialRate: 12.90 },
  { state: "Nevada", code: "NV", residentialRate: 13.53 },
  { state: "New Hampshire", code: "NH", residentialRate: 26.79 },
  { state: "New Jersey", code: "NJ", residentialRate: 23.98 },
  { state: "New Mexico", code: "NM", residentialRate: 15.08 },
  { state: "New York", code: "NY", residentialRate: 29.38 },
  { state: "North Carolina", code: "NC", residentialRate: 14.94 },
  { state: "North Dakota", code: "ND", residentialRate: 12.36 },
  { state: "Ohio", code: "OH", residentialRate: 18.70 },
  { state: "Oklahoma", code: "OK", residentialRate: 13.58 },
  { state: "Oregon", code: "OR", residentialRate: 15.40 },
  { state: "Pennsylvania", code: "PA", residentialRate: 21.04 },
  { state: "Rhode Island", code: "RI", residentialRate: 29.22 },
  { state: "South Carolina", code: "SC", residentialRate: 15.93 },
  { state: "South Dakota", code: "SD", residentialRate: 14.50 },
  { state: "Tennessee", code: "TN", residentialRate: 13.87 },
  { state: "Texas", code: "TX", residentialRate: 16.06 },
  { state: "Utah", code: "UT", residentialRate: 13.16 },
  { state: "Vermont", code: "VT", residentialRate: 23.95 },
  { state: "Virginia", code: "VA", residentialRate: 16.83 },
  { state: "Washington", code: "WA", residentialRate: 14.40 },
  { state: "West Virginia", code: "WV", residentialRate: 15.47 },
  { state: "Wisconsin", code: "WI", residentialRate: 19.00 },
  { state: "Wyoming", code: "WY", residentialRate: 13.95 },
];

/*
 * Average U.S. residential solar installation cost by system size.
 * These are planning estimates, not quotes.
 *
 * The values use an illustrative $2,600/kW baseline.
 * Replace this array with your approved commercial pricing when available.
 */
const solarSystemCosts = [
  { size: 1, averageCost: 2600 },
  { size: 2, averageCost: 5200 },
  { size: 3, averageCost: 7800 },
  { size: 4, averageCost: 10400 },
  { size: 5, averageCost: 13000 },
  { size: 6, averageCost: 15600 },
  { size: 7, averageCost: 18200 },
  { size: 8, averageCost: 20800 },
  { size: 9, averageCost: 23400 },
  { size: 10, averageCost: 26000 },
  { size: 11, averageCost: 28600 },
  { size: 12, averageCost: 31200 },
  { size: 13, averageCost: 33800 },
  { size: 14, averageCost: 36400 },
  { size: 15, averageCost: 39000 },
  { size: 16, averageCost: 41600 },
  { size: 17, averageCost: 44200 },
  { size: 18, averageCost: 46800 },
  { size: 19, averageCost: 49400 },
  { size: 20, averageCost: 52000 },
  { size: 25, averageCost: 65000 },
  { size: 30, averageCost: 78000 },
  { size: 35, averageCost: 91000 },
  { size: 40, averageCost: 104000 },
  { size: 45, averageCost: 117000 },
  { size: 50, averageCost: 130000 },
];

const solarDefaults = {
  stateCode: "CA",
  monthlyBill: 181,
  annualKwh: 0,
  useAnnualKwh: false,
  utilityInflation: 5,
  solarOffset: 100,
  monthlyExportCredit: 5,
  projectionYears: 25,
};

function EstimatePage() {
  const serviceNames = Object.keys(pricingConfig.services);

  const [selectedService, setSelectedService] = useState(serviceNames[0]);
  const [quantity, setQuantity] = useState(
    pricingConfig.services[serviceNames[0]].defaultQuantity
  );
  const [complexity, setComplexity] = useState("standard");
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [estimateGenerated, setEstimateGenerated] = useState(false);
  const [estimateReference, setEstimateReference] = useState("");

  // Solar-specific inputs.
  const [solarState, setSolarState] = useState(solarDefaults.stateCode);
  const [monthlyBill, setMonthlyBill] = useState(solarDefaults.monthlyBill);
  const [annualKwh, setAnnualKwh] = useState(solarDefaults.annualKwh);
  const [useAnnualKwh, setUseAnnualKwh] = useState(solarDefaults.useAnnualKwh);
  const [utilityInflation, setUtilityInflation] = useState(
    solarDefaults.utilityInflation
  );
  const [solarOffset, setSolarOffset] = useState(solarDefaults.solarOffset);
  const [monthlyExportCredit, setMonthlyExportCredit] = useState(
    solarDefaults.monthlyExportCredit
  );
  const [projectionYears, setProjectionYears] = useState(
    solarDefaults.projectionYears
  );

  const service = pricingConfig.services[selectedService];
  const minimumQuantity = Number(service?.minimumQuantity ?? 1);
  const maximumQuantity = Number(service?.maximumQuantity ?? 50);
  const defaultQuantity = Number(service?.defaultQuantity ?? minimumQuantity);
  const isSolar = selectedService.toLowerCase() === "solar";

  const selectedComplexity =
    pricingConfig.complexityLevels.find(
      (level) => level.value === complexity
    ) ?? pricingConfig.complexityLevels[1];

  const selectedRate = useMemo(
    () =>
      electricityRates.find((item) => item.code === solarState) ??
      electricityRates[0],
    [solarState]
  );

  const solarCalculation = useMemo(() => {
    if (!isSolar) return null;

    const systemSize = Math.max(Number(quantity) || 0, 0);
    const ratePerKwh = selectedRate.residentialRate / 100;

    /*
     * If annual kWh is supplied, use it directly.
     * Otherwise estimate annual consumption from the user's monthly bill.
     *
     * Formula:
     * annual kWh = annual electricity bill / state average $/kWh
     */
    const estimatedAnnualKwhFromBill =
      monthlyBill > 0 && ratePerKwh > 0
        ? (Number(monthlyBill) * 12) / ratePerKwh
        : 0;

    const customerAnnualKwh = useAnnualKwh
      ? Math.max(Number(annualKwh) || 0, 0)
      : estimatedAnnualKwhFromBill;

    const firstYearUtilityCost = customerAnnualKwh * ratePerKwh;

    /*
     * The customer's selected solar offset determines the amount of
     * electricity cost that is treated as avoided.
     */
    const firstYearElectricitySavings =
      firstYearUtilityCost * (Number(solarOffset) / 100);

    const annualExportRevenue = Number(monthlyExportCredit || 0) * 12;

    /*
     * Base installation cost comes from the selected system-size table.
     * Interpolate between the nearest available sizes so 21 kW, 22 kW,
     * etc. do not fail.
     */
    const installationCost = getSolarSystemCost(
      systemSize,
      solarSystemCosts
    );

    const extraCost = service.extras
      .filter((extra) => selectedExtras.includes(extra.id))
      .reduce((total, extra) => total + Number(extra.price || 0), 0);

    const totalInvestment =
      installationCost + extraCost;

    const yearlyProjection = [];
    let cumulativeSavings = 0;
    let paybackYear = null;
    let paybackMonth = null;

    for (let year = 1; year <= Number(projectionYears); year += 1) {
      const inflationMultiplier = Math.pow(
        1 + Number(utilityInflation) / 100,
        year - 1
      );

      const annualUtilityCost =
        firstYearUtilityCost * inflationMultiplier;

      const electricitySavings =
        annualUtilityCost * (Number(solarOffset) / 100);

      const annualBenefit =
        electricitySavings + annualExportRevenue;

      cumulativeSavings += annualBenefit;

      if (paybackYear === null && cumulativeSavings >= totalInvestment) {
        paybackYear = year;

        const previousCumulative =
          cumulativeSavings - annualBenefit;

        const remainingAtStart =
          Math.max(totalInvestment - previousCumulative, 0);

        paybackMonth =
          annualBenefit > 0
            ? Math.min(
                12,
                Math.max(
                  1,
                  Math.ceil((remainingAtStart / annualBenefit) * 12)
                )
              )
            : null;
      }

      yearlyProjection.push({
        year,
        annualUtilityCost,
        electricitySavings,
        exportRevenue: annualExportRevenue,
        annualBenefit,
        cumulativeSavings,
        netPosition: cumulativeSavings - totalInvestment,
      });
    }

    const finalProjection =
      yearlyProjection[yearlyProjection.length - 1];

    const totalProjectedSavings =
      finalProjection?.cumulativeSavings ?? 0;

    const totalProjectedNetBenefit =
      totalProjectedSavings - totalInvestment;

    const simpleRoi =
      totalInvestment > 0
        ? (totalProjectedNetBenefit / totalInvestment) * 100
        : 0;

    return {
      systemSize,
      ratePerKwh,
      customerAnnualKwh,
      firstYearUtilityCost,
      firstYearElectricitySavings,
      annualExportRevenue,
      installationCost,
      extraCost,
      totalInvestment,
      yearlyProjection,
      paybackYear,
      paybackMonth,
      totalProjectedSavings,
      totalProjectedNetBenefit,
      simpleRoi,
    };
  }, [
    isSolar,
    quantity,
    selectedRate,
    monthlyBill,
    annualKwh,
    useAnnualKwh,
    utilityInflation,
    solarOffset,
    monthlyExportCredit,
    projectionYears,
    selectedExtras,
    service.extras,
  ]);

  const calculation = useMemo(() => {
    const validQuantity = Number(quantity) || 0;

    const extrasTotal = service.extras
      .filter((extra) => selectedExtras.includes(extra.id))
      .reduce((total, extra) => total + extra.price, 0);

    if (isSolar && solarCalculation) {
      const adjustedEstimate =
        solarCalculation.totalInvestment * selectedComplexity.multiplier;

      return {
        basePrice: solarCalculation.installationCost,
        quantityCost: 0,
        extrasTotal: solarCalculation.extraCost,
        adjustedEstimate,
        lowerEstimate: roundToNearestHundred(
          adjustedEstimate * pricingConfig.estimateRange.lowerPercentage
        ),
        upperEstimate: roundToNearestHundred(
          adjustedEstimate * pricingConfig.estimateRange.upperPercentage
        ),
        solar: solarCalculation,
      };
    }

    const baseCalculation =
      service.basePrice +
      validQuantity * service.unitRate +
      extrasTotal;

    const adjustedEstimate =
      baseCalculation * selectedComplexity.multiplier;

    const lowerEstimate =
      adjustedEstimate * pricingConfig.estimateRange.lowerPercentage;

    const upperEstimate =
      adjustedEstimate * pricingConfig.estimateRange.upperPercentage;

    return {
      basePrice: service.basePrice,
      quantityCost: validQuantity * service.unitRate,
      extrasTotal,
      adjustedEstimate,
      lowerEstimate: roundToNearestHundred(lowerEstimate),
      upperEstimate: roundToNearestHundred(upperEstimate),
      solar: null,
    };
  }, [
    quantity,
    selectedExtras,
    selectedComplexity,
    service,
    isSolar,
    solarCalculation,
  ]);

  function handleServiceChange(event) {
    const newServiceName = event.target.value;
    const newService = pricingConfig.services[newServiceName];

    setSelectedService(newServiceName);
    setQuantity(newService.defaultQuantity);
    setComplexity("standard");
    setSelectedExtras([]);
    setEstimateGenerated(false);
    setEstimateReference("");
  }

  function handleExtraChange(extraId) {
    setSelectedExtras((currentExtras) => {
      if (currentExtras.includes(extraId)) {
        return currentExtras.filter((currentId) => currentId !== extraId);
      }

      return [...currentExtras, extraId];
    });

    setEstimateGenerated(false);
  }

  function generateEstimate() {
    const numericQuantity = Number(quantity);

    if (
      !numericQuantity ||
      numericQuantity < minimumQuantity ||
      numericQuantity > maximumQuantity
    ) {
      return;
    }

    if (
      isSolar &&
      (!solarState ||
        Number(monthlyBill) < 0 ||
        Number(utilityInflation) < 0 ||
        Number(solarOffset) < 0 ||
        Number(solarOffset) > 100 ||
        Number(monthlyExportCredit) < 0)
    ) {
      return;
    }

    setEstimateReference(createEstimateReference());
    setEstimateGenerated(true);
  }

  function resetCalculator() {
    const firstServiceName = serviceNames[0];
    const firstService = pricingConfig.services[firstServiceName];

    setSelectedService(firstServiceName);
    setQuantity(
      Number(firstService?.defaultQuantity ?? firstService?.minimumQuantity ?? 1)
    );
    setComplexity("standard");
    setSelectedExtras([]);
    setEstimateGenerated(false);
    setEstimateReference("");

    setSolarState(solarDefaults.stateCode);
    setMonthlyBill(solarDefaults.monthlyBill);
    setAnnualKwh(solarDefaults.annualKwh);
    setUseAnnualKwh(solarDefaults.useAnnualKwh);
    setUtilityInflation(solarDefaults.utilityInflation);
    setSolarOffset(solarDefaults.solarOffset);
    setMonthlyExportCredit(solarDefaults.monthlyExportCredit);
    setProjectionYears(solarDefaults.projectionYears);
  }

  function printEstimate() {
    window.print();
  }

    const quantityIsValid =
      Number(quantity) >= minimumQuantity &&
      Number(quantity) <= maximumQuantity;

  return (
    <>
      <PageHero
        eyebrow="Preliminary estimate"
        title="Start with a clearer sense of scope."
        description="Build an illustrative project range using a few basic inputs. Final pricing requires measurements, specifications and a property assessment."
        image="/images/hero-home.png"
        imageAlt="Contemporary property with solar panels and premium roofing"
      />

      <ContentSection>
        <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
          <EstimateIntroduction isSolar={isSolar} />

          <div className="border border-taupe bg-white p-5 sm:p-8 lg:p-11">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-gold">
                Estimate builder
              </p>

              <h2 className="mt-3 font-heading text-4xl font-semibold text-charcoal sm:text-5xl">
                Configure your project.
              </h2>
            </div>

            <div className="mb-7 border-l-4 border-gold bg-cream px-5 py-4 text-sm leading-6 text-warmGray">
              <strong className="text-charcoal">
                Demonstration pricing:
              </strong>{" "}
              The current prices are planning allowances for design and
              testing. They are not an offer, contract or guaranteed project
              price.
            </div>

            <div className="grid gap-6">
              <FormField label="Service" htmlFor="estimateService">
                <select
                  id="estimateService"
                  value={selectedService}
                  onChange={handleServiceChange}
                  className={inputClasses}
                >
                  {serviceNames.map((serviceName) => (
                    <option key={serviceName} value={serviceName}>
                      {serviceName}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label={`${service.unitLabel} (${service.unitSuffix})`}
                  htmlFor="estimateQuantity"
                >
                <input
                  id="estimateQuantity"
                  type="number"
                  min={minimumQuantity}
                  max={maximumQuantity}
                  step="1"
                  value={quantity}
                    onChange={(event) => {
                      setQuantity(event.target.value);
                      setEstimateGenerated(false);
                    }}
                    className={inputClasses}
                  />

                  <span className="text-xs text-warmGray">
                    Enter a value between{" "}
                    {minimumQuantity.toLocaleString()} and{" "}
                    {maximumQuantity.toLocaleString()}.
                  </span>

                  {!quantityIsValid && (
                    <span className="text-xs font-medium text-red-700">
                      Enter a quantity within the permitted range.
                    </span>
                  )}
                </FormField>

                <FormField
                  label="Project complexity"
                  htmlFor="estimateComplexity"
                >
                  <select
                    id="estimateComplexity"
                    value={complexity}
                    onChange={(event) => {
                      setComplexity(event.target.value);
                      setEstimateGenerated(false);
                    }}
                    className={inputClasses}
                  >
                    {pricingConfig.complexityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {isSolar && (
                <SolarInputs
                  solarState={solarState}
                  setSolarState={(value) => {
                    setSolarState(value);
                    setEstimateGenerated(false);
                  }}
                  monthlyBill={monthlyBill}
                  setMonthlyBill={(value) => {
                    setMonthlyBill(value);
                    setEstimateGenerated(false);
                  }}
                  annualKwh={annualKwh}
                  setAnnualKwh={(value) => {
                    setAnnualKwh(value);
                    setEstimateGenerated(false);
                  }}
                  useAnnualKwh={useAnnualKwh}
                  setUseAnnualKwh={(value) => {
                    setUseAnnualKwh(value);
                    setEstimateGenerated(false);
                  }}
                  utilityInflation={utilityInflation}
                  setUtilityInflation={(value) => {
                    setUtilityInflation(value);
                    setEstimateGenerated(false);
                  }}
                  solarOffset={solarOffset}
                  setSolarOffset={(value) => {
                    setSolarOffset(value);
                    setEstimateGenerated(false);
                  }}
                  monthlyExportCredit={monthlyExportCredit}
                  setMonthlyExportCredit={(value) => {
                    setMonthlyExportCredit(value);
                    setEstimateGenerated(false);
                  }}
                  projectionYears={projectionYears}
                  setProjectionYears={(value) => {
                    setProjectionYears(value);
                    setEstimateGenerated(false);
                  }}
                  selectedRate={selectedRate}
                  solarCalculation={solarCalculation}
                />
              )}

              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-charcoal">
                  Additional project allowances
                </legend>

                <div className="grid gap-3 sm:grid-cols-2">
                  {service.extras.map((extra) => {
                    const selected = selectedExtras.includes(extra.id);

                    return (
                      <label
                        key={extra.id}
                        className={[
                          "flex cursor-pointer items-center justify-between gap-4 border px-4 py-4 transition",
                          selected
                            ? "border-forest bg-sage/30"
                            : "border-taupe bg-[#FBFAF7] hover:border-dustySage",
                        ].join(" ")}
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => handleExtraChange(extra.id)}
                            className="h-4 w-4 accent-forest"
                          />

                          <span className="text-sm text-charcoal">
                            {extra.label}
                          </span>
                        </span>

                        <span className="whitespace-nowrap text-sm font-semibold text-forest">
                          +{formatCurrency(extra.price)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-taupe pt-7 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={resetCalculator}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 border border-taupe px-6 text-sm font-semibold text-charcoal transition hover:bg-cream"
              >
                <RefreshCcw size={16} />
                Reset
              </button>

              <button
                type="button"
                onClick={generateEstimate}
                disabled={!quantityIsValid}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 bg-forest px-7 text-sm font-semibold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Calculator size={17} />
                Generate estimate
              </button>
            </div>

            {estimateGenerated && (
              <EstimateResult
                serviceName={selectedService}
                service={service}
                quantity={quantity}
                complexity={selectedComplexity}
                selectedExtras={selectedExtras}
                calculation={calculation}
                estimateReference={estimateReference}
                printEstimate={printEstimate}
              />
            )}
          </div>
        </div>
      </ContentSection>
    </>
  );
}

function SolarInputs({
  solarState,
  setSolarState,
  monthlyBill,
  setMonthlyBill,
  annualKwh,
  setAnnualKwh,
  useAnnualKwh,
  setUseAnnualKwh,
  utilityInflation,
  setUtilityInflation,
  solarOffset,
  setSolarOffset,
  monthlyExportCredit,
  setMonthlyExportCredit,
  projectionYears,
  setProjectionYears,
  selectedRate,
  solarCalculation,
}) {
  return (
    <section className="border border-sage bg-[#F7FAF5] p-5 sm:p-6">
      <div className="mb-6 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center bg-sage/50 text-forest">
          <Sun size={21} />
        </span>

        <div>
          <h3 className="text-lg font-semibold text-charcoal">
            Solar savings model
          </h3>

          <p className="mt-1 text-sm leading-6 text-warmGray">
            Estimate electricity savings and payback using the customer's
            location, utility bill, solar system size and assumptions.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Customer location" htmlFor="solarState">
          <select
            id="solarState"
            value={solarState}
            onChange={(event) => setSolarState(event.target.value)}
            className={inputClasses}
          >
            {electricityRates.map((item) => (
              <option key={item.code} value={item.code}>
                {item.state}
              </option>
            ))}
          </select>

          <span className="text-xs text-warmGray">
            EIA residential rate:{" "}
            <strong className="text-charcoal">
              {formatCentsPerKwh(selectedRate.residentialRate)}
            </strong>
          </span>
        </FormField>

        <FormField label="Monthly utility bill" htmlFor="monthlyBill">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-warmGray">
              $
            </span>

            <input
              id="monthlyBill"
              type="number"
              min="0"
              step="1"
              value={monthlyBill}
              onChange={(event) => setMonthlyBill(event.target.value)}
              className={`${inputClasses} pl-8`}
            />
          </div>

          <span className="text-xs text-warmGray">
            Used to estimate annual electricity consumption when annual kWh is
            not supplied.
          </span>
        </FormField>
      </div>

      <div className="mt-5 border border-taupe bg-white p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={useAnnualKwh}
            onChange={(event) => setUseAnnualKwh(event.target.checked)}
            className="mt-1 h-4 w-4 accent-forest"
          />

          <span>
            <span className="block text-sm font-semibold text-charcoal">
              Use customer's annual kWh instead of estimating it
            </span>

            <span className="mt-1 block text-xs leading-5 text-warmGray">
              This is more accurate when the customer's utility bill provides
              annual consumption.
            </span>
          </span>
        </label>

        {useAnnualKwh && (
          <div className="mt-4">
            <FormField
              label="Annual electricity consumption (kWh)"
              htmlFor="annualKwh"
            >
              <input
                id="annualKwh"
                type="number"
                min="0"
                step="100"
                value={annualKwh}
                onChange={(event) => setAnnualKwh(event.target.value)}
                className={inputClasses}
              />
            </FormField>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <FormField
          label="Utility increase"
          htmlFor="utilityInflation"
        >
          <div className="relative">
            <input
              id="utilityInflation"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={utilityInflation}
              onChange={(event) =>
                setUtilityInflation(event.target.value)
              }
              className={`${inputClasses} pr-9`}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-warmGray">
              %
            </span>
          </div>
        </FormField>

        <FormField
          label="Solar offset"
          htmlFor="solarOffset"
        >
          <div className="relative">
            <input
              id="solarOffset"
              type="number"
              min="0"
              max="100"
              step="1"
              value={solarOffset}
              onChange={(event) => setSolarOffset(event.target.value)}
              className={`${inputClasses} pr-9`}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-warmGray">
              %
            </span>
          </div>
        </FormField>

        <FormField
          label="Monthly grid"
          htmlFor="monthlyExportCredit"
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-warmGray">
              $
            </span>
            <input
              id="monthlyExportCredit"
              type="number"
              min="0"
              step="1"
              value={monthlyExportCredit}
              onChange={(event) =>
                setMonthlyExportCredit(event.target.value)
              }
              className={`${inputClasses} pl-8`}
            />
          </div>
        </FormField>

        <FormField
          label="Projection period"
          htmlFor="projectionYears"
        >
          <div className="relative">
            <input
              id="projectionYears"
              type="number"
              min="1"
              max="40"
              step="1"
              value={projectionYears}
              onChange={(event) =>
                setProjectionYears(event.target.value)
              }
              className={`${inputClasses} pr-16`}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-warmGray">
              years
            </span>
          </div>
        </FormField>
      </div>

      {solarCalculation && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MetricCard
            icon={Zap}
            label="Estimated annual usage"
            value={`${Math.round(
              solarCalculation.customerAnnualKwh
            ).toLocaleString()} kWh`}
          />

          <MetricCard
            icon={DollarSign}
            label="Estimated system cost"
            value={formatCurrency(solarCalculation.totalInvestment)}
          />

          <MetricCard
            icon={TrendingUp}
            label="First-year benefit"
            value={formatCurrency(
              solarCalculation.firstYearElectricitySavings +
                solarCalculation.annualExportRevenue
            )}
          />
        </div>
      )}

      <p className="mt-5 text-[11px] leading-5 text-warmGray">
        Electricity-rate source/version used by this calculator: EIA,{" "}
        {EIA_RATE_VERSION}. Rates are planning inputs and should be refreshed
        when a new EIA release is adopted.
      </p>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="border border-taupe bg-white p-4">
      <div className="flex items-center gap-2 text-forest">
        <Icon size={16} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>

      <strong className="mt-2 block font-heading text-2xl text-charcoal">
        {value}
      </strong>
    </div>
  );
}

function EstimateIntroduction({ isSolar }) {
  return (
    <aside>
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.17em] text-gold">
        Estimate builder
      </p>

      <h2 className="font-heading text-5xl font-semibold leading-[0.95] text-charcoal sm:text-6xl">
        Useful direction—not a final quote.
      </h2>

      <p className="mt-7 leading-7 text-warmGray">
        The calculator provides an illustrative planning estimate. Final
        pricing requires measurements, specifications and a property
        assessment.
      </p>

      <div className="mt-9 space-y-5">
        <InformationItem
          icon={Calculator}
          title="Instant project range"
          description="Generate an illustrative low-to-high project range from the selected inputs."
        />

        {isSolar && (
          <>
            <InformationItem
              icon={Sun}
              title="Solar savings projection"
              description="Estimate electricity savings, export income and cumulative financial benefit over time."
            />

            <InformationItem
              icon={TrendingUp}
              title="Payback analysis"
              description="See when cumulative solar benefits are estimated to recover the project investment."
            />
          </>
        )}

        <InformationItem
          icon={ShieldCheck}
          title="No personal information required"
          description="Visitors can explore a preliminary estimate without submitting contact details."
        />

        <InformationItem
          icon={Info}
          title="Final proposal after verification"
          description="Measurements, materials and property conditions must be confirmed before final pricing."
        />
      </div>
    </aside>
  );
}

function InformationItem({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center bg-sage/40 text-forest">
        <Icon size={21} strokeWidth={1.7} />
      </span>

      <span>
        <strong className="block text-sm text-charcoal">{title}</strong>

        <span className="mt-1 block text-sm leading-6 text-warmGray">
          {description}
        </span>
      </span>
    </div>
  );
}

function EstimateResult({
  serviceName,
  service,
  quantity,
  complexity,
  selectedExtras,
  calculation,
  estimateReference,
  printEstimate,
}) {
  const selectedExtraItems = service.extras.filter((extra) =>
    selectedExtras.includes(extra.id)
  );

  const isSolar = Boolean(calculation.solar);

  return (
    <section
      className="estimate-print-area mt-9 bg-forest p-6 text-white sm:p-9"
      aria-live="polite"
    >
      <div className="flex flex-col gap-5 border-b border-white/15 pb-7 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#E7C995]">
            Preliminary project estimate
          </p>

          <h3 className="mt-3 font-heading text-4xl font-semibold">
            {serviceName}
          </h3>
        </div>

        <div className="text-left sm:text-right">
          <span className="block text-xs text-white/50">Reference</span>

          <strong className="mt-1 block text-sm">
            {estimateReference}
          </strong>
        </div>
      </div>

      <div className="py-8">
        <span className="block text-sm text-white/55">
          Illustrative project range
        </span>

        <strong className="mt-2 block font-heading text-4xl font-semibold text-[#EAD4AB] sm:text-5xl">
          {formatCurrency(calculation.lowerEstimate)}
          {" – "}
          {formatCurrency(calculation.upperEstimate)}
        </strong>

        <span className="mt-2 block text-xs uppercase tracking-[0.12em] text-white/45">
          {pricingConfig.currency}
        </span>
      </div>

      {isSolar && <SolarFinancialSummary calculation={calculation.solar} />}

      <div className="border-y border-white/15 py-6">
        <h4 className="text-sm font-semibold">Estimate summary</h4>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <SummaryItem label="Service" value={serviceName} />

          <SummaryItem
            label={service.unitLabel}
            value={`${Number(quantity).toLocaleString()} ${
              service.unitSuffix
            }`}
          />

          <SummaryItem
            label="Complexity"
            value={complexity.label}
          />

          <SummaryItem
            label="Additional allowances"
            value={
              selectedExtraItems.length > 0
                ? selectedExtraItems
                    .map((extra) => extra.label)
                    .join(", ")
                : "None selected"
            }
          />
        </dl>
      </div>

      <div className="mt-7 flex items-start gap-3 bg-white/10 p-4">
        <Check
          size={19}
          className="mt-1 shrink-0 text-[#E7C995]"
        />

        <p className="text-sm leading-6 text-white/65">
          This is a preliminary estimate based on the information entered.
          Final pricing may change following site inspection, measurements,
          material selection, permits, structural findings and confirmation
          of project requirements.
        </p>
      </div>

      <div className="estimate-screen-actions mt-7 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={printEstimate}
          className="inline-flex min-h-[50px] items-center justify-center gap-2 border border-white/40 px-6 text-sm font-semibold text-white transition hover:bg-white hover:text-charcoal"
        >
          <Printer size={17} />
          Print or save PDF
        </button>

        <PrimaryButton to="/booking" variant="gold">
          Book a consultation
        </PrimaryButton>
      </div>
    </section>
  );
}

function SolarFinancialSummary({ calculation }) {
  const {
    systemSize,
    ratePerKwh,
    customerAnnualKwh,
    firstYearUtilityCost,
    firstYearElectricitySavings,
    annualExportRevenue,
    totalInvestment,
    paybackYear,
    paybackMonth,
    totalProjectedSavings,
    totalProjectedNetBenefit,
    simpleRoi,
    yearlyProjection,
  } = calculation;

  const visibleRows = yearlyProjection.slice(0, 10);

  return (
    <div className="mb-7">
      <div className="border-y border-white/15 py-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center bg-white/10 text-[#E7C995]">
            <Sun size={19} />
          </span>

          <div>
            <h4 className="text-sm font-semibold">
              Solar financial projection
            </h4>

            <p className="mt-1 text-xs text-white/50">
              Planning model based on the selected utility rate and
              assumptions.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FinancialMetric
            label="System size"
            value={`${systemSize} kW`}
          />

          <FinancialMetric
            label="Electricity rate"
            value={`${ratePerKwh.toFixed(4)} / kWh`}
          />

          <FinancialMetric
            label="Annual usage"
            value={`${Math.round(
              customerAnnualKwh
            ).toLocaleString()} kWh`}
          />

          <FinancialMetric
            label="Year 1 utility cost"
            value={formatCurrency(firstYearUtilityCost)}
          />

          <FinancialMetric
            label="Year 1 electricity savings"
            value={formatCurrency(firstYearElectricitySavings)}
          />

          <FinancialMetric
            label="Annual export income"
            value={formatCurrency(annualExportRevenue)}
          />

          <FinancialMetric
            label="Total investment"
            value={formatCurrency(totalInvestment)}
          />

          <FinancialMetric
            label="Estimated payback"
            value={
              paybackYear
                ? `Year ${paybackYear}${
                    paybackMonth ? ` / month ${paybackMonth}` : ""
                  }`
                : "Beyond projection"
            }
          />
        </div>
      </div>

      <div className="border-b border-white/15 py-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <FinancialMetric
            label="Projected cumulative savings"
            value={formatCurrency(totalProjectedSavings)}
          />

          <FinancialMetric
            label="Projected net benefit"
            value={formatCurrency(totalProjectedNetBenefit)}
          />

          <FinancialMetric
            label="Simple projected ROI"
            value={`${simpleRoi.toFixed(1)}%`}
          />
        </div>
      </div>

      <div className="border-b border-white/15 py-6">
        <div className="flex items-center gap-2">
          <BatteryCharging size={17} className="text-[#E7C995]" />

          <h4 className="text-sm font-semibold">
            First 10 projection years
          </h4>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="text-white/45">
              <tr className="border-b border-white/10">
                <th className="px-3 py-3 font-medium">Year</th>
                <th className="px-3 py-3 font-medium">
                  Utility cost
                </th>
                <th className="px-3 py-3 font-medium">
                  Electricity savings
                </th>
                <th className="px-3 py-3 font-medium">
                  Export income
                </th>
                <th className="px-3 py-3 font-medium">
                  Annual benefit
                </th>
                <th className="px-3 py-3 font-medium">
                  Cumulative
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((row) => (
                <tr
                  key={row.year}
                  className="border-b border-white/10 text-white/75"
                >
                  <td className="px-3 py-3 font-semibold text-white">
                    {row.year}
                  </td>
                  <td className="px-3 py-3">
                    {formatCurrency(row.annualUtilityCost)}
                  </td>
                  <td className="px-3 py-3">
                    {formatCurrency(row.electricitySavings)}
                  </td>
                  <td className="px-3 py-3">
                    {formatCurrency(row.exportRevenue)}
                  </td>
                  <td className="px-3 py-3">
                    {formatCurrency(row.annualBenefit)}
                  </td>
                  <td className="px-3 py-3 font-semibold text-[#EAD4AB]">
                    {formatCurrency(row.cumulativeSavings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FinancialMetric({ label, value }) {
  return (
    <div className="bg-white/10 p-4">
      <span className="block text-[10px] uppercase tracking-[0.1em] text-white/45">
        {label}
      </span>

      <strong className="mt-1 block text-sm text-white">
        {value}
      </strong>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-white/45">{label}</dt>

      <dd className="mt-1 text-white/85">{value}</dd>
    </div>
  );
}

function FormField({ label, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-semibold text-charcoal"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

/*
 * Returns the estimated solar installation cost for a system size.
 *
 * Exact sizes in solarSystemCosts are returned directly.
 * Missing sizes are linearly interpolated between the nearest lower
 * and upper entries. Outside the table, the nearest boundary price
 * is used.
 */
function getSolarSystemCost(size, costTable) {
  const numericSize = Math.max(Number(size) || 0, 0);

  if (!costTable.length || numericSize <= 0) {
    return 0;
  }

  const exact = costTable.find(
    (item) => item.size === numericSize
  );

  if (exact) {
    return exact.averageCost;
  }

  const sorted = [...costTable].sort(
    (a, b) => a.size - b.size
  );

  const lower = [...sorted]
    .reverse()
    .find((item) => item.size < numericSize);

  const upper = sorted.find(
    (item) => item.size > numericSize
  );

  if (!lower) {
    return sorted[0].averageCost;
  }

  if (!upper) {
    return sorted[sorted.length - 1].averageCost;
  }

  const sizeRange = upper.size - lower.size;
  const costRange = upper.averageCost - lower.averageCost;
  const position = (numericSize - lower.size) / sizeRange;

  return lower.averageCost + costRange * position;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: pricingConfig.currency,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatCentsPerKwh(amount) {
  return `${Number(amount).toFixed(2)}¢/kWh`;
}

function roundToNearestHundred(number) {
  return Math.round(number / 100) * 100;
}

function createEstimateReference() {
  const date = new Date();

  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase();

  return `EST-${datePart}-${randomPart}`;
}

const inputClasses = [
  "min-h-[50px]",
  "w-full",
  "border",
  "border-taupe",
  "bg-[#FBFAF7]",
  "px-4",
  "py-3",
  "text-sm",
  "text-charcoal",
  "outline-none",
  "transition",
  "placeholder:text-warmGray/60",
  "focus:border-forest",
  "focus:ring-2",
  "focus:ring-forest/10",
].join(" ");

export default EstimatePage;
