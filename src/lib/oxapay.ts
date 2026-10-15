import "server-only";

const OXAPAY_INVOICE_ENDPOINT = "https://api.oxapay.com/v1/payment/invoice";

export type OxapayInvoice = {
  trackId: string;
  paymentUrl: string;
  expiredAt: number;
};

type OxapayResponse = {
  status?: number;
  message?: string;
  error?: { message?: string } | null;
  data?: {
    track_id?: string | number;
    payment_url?: string;
    expired_at?: number;
  };
};

/** Server-side OxaPay invoice creation (merchant key never leaves the server). */
export async function createOxapayInvoice(params: {
  amount: number;
  orderId: string;
  description: string;
  callbackUrl: string;
  returnUrl: string;
  email?: string;
}): Promise<{ ok: true; invoice: OxapayInvoice } | { ok: false; error: string }> {
  const key = process.env.OXAPAY_MERCHANT_KEY;
  if (!key) {
    console.error("[oxapay] OXAPAY_MERCHANT_KEY is not set");
    return { ok: false, error: "Payments are not configured yet." };
  }

  try {
    const res = await fetch(OXAPAY_INVOICE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchant_api_key: key,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: "USD",
        lifetime: 60,
        order_id: params.orderId,
        description: params.description,
        callback_url: params.callbackUrl,
        return_url: params.returnUrl,
        thanks_message: "Thank you for supporting Mr.Anime!",
        ...(params.email ? { email: params.email } : {}),
      }),
      cache: "no-store",
    });

    const json = (await res.json().catch(() => null)) as OxapayResponse | null;
    if (!res.ok || json?.status !== 200 || !json.data?.payment_url || !json.data.track_id) {
      const message = json?.error?.message ?? json?.message ?? "Could not create the payment link.";
      console.error("[oxapay] invoice failed", res.status, message);
      return { ok: false, error: message };
    }

    return {
      ok: true,
      invoice: {
        trackId: String(json.data.track_id),
        paymentUrl: String(json.data.payment_url),
        expiredAt: Number(json.data.expired_at ?? 0),
      },
    };
  } catch (error) {
    console.error("[oxapay] invoice request failed", error);
    return { ok: false, error: "Could not reach the payment gateway. Try again." };
  }
}
