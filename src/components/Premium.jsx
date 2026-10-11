
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useEffect, useState } from "react";

const Premium = () => {
  const [isUserPremium, setIsUserPremium] = useState(false);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [paymentPending, setPaymentPending] = useState(false);

  const verifyPremiumUser = async () => {
    try {
      const res = await axios.get(BASE_URL + "/premium/verify", {
        withCredentials: true,
      });

      const premium = Boolean(res.data.isPremium);
      setIsUserPremium(premium);

      return premium;
    } catch (err) {
      console.error("Premium verification failed:", err);
      return false;
    }
  };

  useEffect(() => {
    verifyPremiumUser();
  }, []);

  const handleBuyClick = async (membershipType) => {
    setError("");
    setLoading(membershipType);
    setPaymentPending(false);

    try {
      if (!window.Razorpay) {
        throw new Error(
          "Razorpay Checkout load nahi hua. Please refresh the page."
        );
      }

      const res = await axios.post(
        BASE_URL + "/payment/create",
        { membershipType },
        { withCredentials: true }
      );

      const { amount, keyId, currency, notes, orderId } = res.data;

      if (!keyId || !orderId) {
        throw new Error("Razorpay key ya order ID missing hai.");
      }

      const membershipName =
        membershipType === "gold" ? "Gold" : "Silver";

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Dev Tinder",
        description: `${membershipName} Membership`,
        order_id: orderId,

        prefill: {
          name: `${notes?.firstName || ""} ${
            notes?.lastName || ""
          }`.trim(),
          email: notes?.emailId || "",
        },

        theme: {
          color: membershipType === "gold" ? "#F59E0B" : "#94A3B8",
        },

        handler: async function () {
          setLoading("Verifying...");
          setPaymentPending(true);
          setError(
            "Payment successful! Your membership is being activated..."
          );

          // Check backend status for up to 60 seconds.
          for (let i = 0; i < 20; i++) {
            const isPremium = await verifyPremiumUser();

            if (isPremium) {
              setPaymentPending(false);
              setLoading("");
              setError("");

              return;
            }

            await new Promise((resolve) => setTimeout(resolve, 3000));
          }

          setPaymentPending(false);
          setLoading("");
          setError(
            "Payment was completed, but membership activation is delayed. Please refresh or try again later. Do not pay again."
          );
        },

        modal: {
          ondismiss: () => {
            setLoading("");
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response.error);

        setError(
          response.error?.description ||
            "Payment failed. Please try again."
        );
        setLoading("");
        setPaymentPending(false);
      });

      rzp.open();
    } catch (err) {
      console.error("Checkout error:", err);

      setError(
        err.response?.data?.msg ||
          (typeof err.response?.data === "string"
            ? err.response.data
            : "") ||
          err.message ||
          "Checkout start nahi ho paya."
      );

      setLoading("");
      setPaymentPending(false);
    }
  };

  if (isUserPremium) {
    return (
      <div className="m-10 text-center">
        <h1 className="text-3xl font-bold">
          You're already a Premium user!
        </h1>
        <p className="mt-3">
          Your membership is active. Enjoy Dev Tinder Premium!
        </p>

        {/* Find Match button */}
          <button
            type="button"
            className="btn btn-primary mt-4"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Find Match
          </button>


      </div>
    );
  }

  return (
    <div className="m-10 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Choose Your Membership</h1>

      {error && (
        <p className="text-center" role="status">
          {error}
        </p>
      )}

      <div className="flex w-full max-w-4xl flex-col justify-center gap-6 md:flex-row">
        {/* Silver Membership */}
        <div className="card bg-base-300 min-h-80 flex-1 gap-4 rounded-box p-6">
          <h2 className="text-center text-2xl font-bold">
            Silver Membership
          </h2>

          <p className="text-center text-3xl font-bold">₹300</p>

          <ul className="flex-1 space-y-2">
            <li>✓ Chat with other people</li>
            <li>✓ Unlimited connection requests</li>
            <li>✓ Silver membership</li>
          </ul>

          <button
            onClick={() => handleBuyClick("silver")}
            className="btn btn-outline"
            disabled={Boolean(loading) || paymentPending}
          >
            {loading === "silver"
              ? "Please wait..."
              : "Buy Silver"}
          </button>
        </div>

        {/* Gold Membership */}
        <div className="card bg-base-300 min-h-80 flex-1 gap-4 rounded-box border-2 border-amber-400 p-6">
          <h2 className="text-center text-2xl font-bold">
            Gold Membership
          </h2>

          <p className="text-center text-3xl font-bold">₹700</p>

          <ul className="flex-1 space-y-2">
            <li>✓ Chat with other people</li>
            <li>✓ Unlimited connection requests</li>
            <li>✓ Blue Tick</li>
            <li>✓ 6 months</li>
          </ul>

          <button
            onClick={() => handleBuyClick("gold")}
            className="btn btn-primary"
            disabled={Boolean(loading) || paymentPending}
          >
            {loading === "gold"
              ? "Please wait..."
              : "Buy Gold"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Premium;
