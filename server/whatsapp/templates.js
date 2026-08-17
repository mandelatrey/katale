// WhatsApp message templates — from the Agribridge design spec (4a).
// Rules from the spec:
//   1. Say who and why, first line
//   2. Six lines maximum
//   3. Numbers in one shape: 1,200 kg · 2,400/kg · 14:00 · 12 km
//   4. Reply keywords instead of links

// ── Onboarding & control ────────────────────────────────────────────────────

export function verificationCode({ code, ttl_minutes }) {
  return (
    `Your Agribridge code is *${code}*.\n` +
    `It works for ${ttl_minutes} minutes. We never ask for it again.`
  );
}

export function setupConfirmed({ first_name, send_time, topics, crops, network_count }) {
  return (
    `You're set up, *${first_name}*.\n` +
    `Every morning at ${send_time} we'll send ${topics} for ${crops} ` +
    `from ${network_count} farmers you follow.\n\n` +
    `Reply *STOP* to pause, *HELP* for the list.`
  );
}

export function paused() {
  return (
    `Stopped. You won't get any messages from us.\n` +
    `Your crops and farmers are saved — reply *START* whenever you want them back.`
  );
}

export function resumed({ first_name } = {}) {
  const greeting = first_name ? `Welcome back, *${first_name}*.` : `You're back on.`;
  return `${greeting} Messages are on again.\n\nReply *HELP* to see what you can ask.`;
}

export function keywordHelp() {
  return [
    `Reply with one word:`,
    `*PRICE* — today's prices for your crops`,
    `*STOCK* — what your farmers have`,
    `*LESS* — fewer messages`,
    `*STOP* — pause everything`,
  ].join("\n");
}

// ── Scheduled ───────────────────────────────────────────────────────────────

export function dailyDigest({
  first_name,
  sub_county,
  rain_time,
  producer,
  qty,
  grade,
  distance,
  order_qty,
  crop,
  price,
} = {}) {
  const lines = [`Good morning ${first_name}.`, ""];
  if (sub_county && rain_time) {
    lines.push(`Rain in *${sub_county}* from ${rain_time}. Dry what's outside.`);
  }
  if (producer && qty) {
    lines.push(`${producer} has ${qty}, grade ${grade}, ${distance} away.`);
  }
  if (order_qty && crop && price) {
    lines.push(`A buyer wants ${order_qty} ${crop} at ${price}.`);
  }
  lines.push("", `Reply *MORE* for the rest.`);
  return lines.join("\n");
}

export function weeklySummary({
  crop,
  market,
  price,
  direction,
  change_pct,
  n_producers,
  n_orders,
  crop_2,
}) {
  return [
    `Your week so far:`,
    "",
    `${crop} in ${market}: ${price}, ${direction} ${change_pct}.`,
    `${n_producers} farmers you follow added stock.`,
    `${n_orders} new orders for ${crop_2}.`,
    "",
    `Reply *STOCK* to see who has what.`,
  ].join("\n");
}

// ── Triggered alerts ────────────────────────────────────────────────────────

export function weatherWarning({ event, sub_county, day, start, end, advice_line }) {
  return [
    `*${event} warning*`,
    `${sub_county}, ${day} from ${start} to ${end}.`,
    advice_line,
  ].join("\n");
}

export function orderAlert({ buyer, qty, crop, grade, price, pickup_day }) {
  return [
    `New order near you.`,
    "",
    `*${buyer}* wants ${qty} ${crop}, grade ${grade}, at ${price}. Collection ${pickup_day}.`,
    "",
    `Reply *YES* to be introduced, *NO* to skip.`,
  ].join("\n");
}

export function stockChange({
  producer,
  district,
  qty,
  crop,
  grade,
  timelines,
  next_crop,
  window: harvestWindow,
  pronoun = "their",
}) {
  const lines = [
    `*${producer}* (${district}) now has ${qty} ${crop}, grade ${grade}.`,
  ];
  if (timelines && next_crop && harvestWindow) {
    lines.push(`Harvest of ${next_crop} expected ${harvestWindow}.`);
  }
  lines.push("", `Reply *CALL* to get ${pronoun} number.`);
  return lines.join("\n");
}

export function qualityGrade({ crop, grade, qty, moisture, premium, next_grade }) {
  return [
    `Your ${crop} was graded *${grade}*.`,
    `${qty} at ${moisture} moisture.`,
    `Grade ${grade} earns about ${premium} more than ${next_grade}.`,
  ].join("\n");
}

// ── Private to account holder ───────────────────────────────────────────────

export function paymentReceived({ amount, payer, qty, crop, order_ref, msisdn_last3 }) {
  return [
    `*UGX ${amount}* paid to you by ${payer}.`,
    `For ${qty} ${crop}, order ${order_ref}.`,
    `Sent to your mobile money ending ${msisdn_last3}.`,
  ].join("\n");
}

export function transactionRecord({ qty, crop, grade, buyer, amount, order_ref, date }) {
  return [
    `Sale recorded.`,
    `${qty} ${crop} · grade ${grade}`,
    `Buyer: ${buyer}`,
    `Total: UGX ${amount}`,
    `Ref ${order_ref} · ${date}`,
    "",
    `Keep this message as your receipt.`,
  ].join("\n");
}
