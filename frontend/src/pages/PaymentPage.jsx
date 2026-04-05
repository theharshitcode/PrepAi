// src/pages/PaymentPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import styles from '../styles/PaymentPage.module.scss';

const API_BASE = import.meta.env.VITE_API_URL;

const FEATURES = [
    { icon: '∞', text: 'Unlimited AI mock interviews' },
    { icon: '📊', text: 'Detailed performance reports' },
    { icon: '🎯', text: 'All job roles & categories' },
    { icon: '⚡', text: 'Instant feedback after each round' },
    { icon: '🏆', text: 'Priority support' },
];

export default function PaymentPage() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // null | 'success' | 'failed'
    const [errorMsg, setErrorMsg] = useState('');

    // Redirect if already paid
    useEffect(() => {
        if (user?.isPaid) navigate('/dashboard');
    }, [user, navigate]);

    // Load Razorpay checkout script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => document.body.removeChild(script);
    }, []);

    const getToken = () => localStorage.getItem('token');

    const handlePayment = async () => {
        setLoading(true);
        setStatus(null);
        setErrorMsg('');

        try {
            // Step 1 — Backend se order create karo
            const { data } = await axios.post(
                `${API_BASE}/api/payment/create-order`,
                {},
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            // Step 2 — Razorpay checkout open karo
            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                order_id: data.orderId,
                name: 'Interview Pro',
                description: 'Unlimited Plan — Lifetime Access',
                image: '/logo.png', // apna logo add karo
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                },
                theme: {
                    color: '#6366f1', // $primary
                },
                modal: {
                    ondismiss: () => setLoading(false),
                },
                handler: async (response) => {
                    // Step 3 — Payment verify karo
                    await verifyPayment(response);
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => {
                setStatus('failed');
                setErrorMsg(response.error?.description || 'Payment fail hua');
                setLoading(false);
            });
            rzp.open();

        } catch (err) {
            console.error('Payment error:', err);
            setStatus('failed');
            setErrorMsg(err.response?.data?.message || 'Kuch galat hua, dobara try karo');
            setLoading(false);
        }
    };

    const verifyPayment = async (response) => {
        try {
            const { data } = await axios.post(
                `${API_BASE}/api/payment/verify`,
                {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            // AuthContext update karo
            if (setUser) setUser(data.user);

            setStatus('success');
        } catch (err) {
            setStatus('failed');
            setErrorMsg(err.response?.data?.message || 'Verification fail hua');
        } finally {
            setLoading(false);
        }
    };

    // ─── Success State ───────────────────────────────────────────
    if (status === 'success') {
        return (
            <div className={styles.page}>
                <div className={`${styles.card} ${styles.successCard}`}>
                    <div className={styles.successIcon}>✓</div>
                    <h2 className={styles.successTitle}>Payment Successful!</h2>
                    <p className={styles.successSub}>
                        Tumhara <strong>Unlimited Plan</strong> activate ho gaya hai.
                        Ab unlimited interviews dena shuru karo!
                    </p>
                    <button
                        className={styles.btnPrimary}
                        onClick={() => navigate('/dashboard')}
                    >
                        Dashboard pe jao →
                    </button>
                </div>
            </div>
        );
    }

    // ─── Main Payment Page ───────────────────────────────────────
    return (
        <div className={styles.page}>
            <div className={styles.wrapper}>

                {/* Left — Plan Details */}
                <div className={styles.card}>
                    <div className={styles.planHeader}>
                        <span className={styles.badge}>Most Popular</span>
                        <h1 className={styles.planName}>Unlimited Plan</h1>
                        <div className={styles.priceRow}>
                            <span className={styles.currency}>₹</span>
                            <span className={styles.amount}>499</span>
                        </div>
                        <p className={styles.priceSub}>one-time · lifetime access · no hidden charges</p>
                    </div>

                    <hr className={styles.divider} />

                    <ul className={styles.featureList}>
                        {FEATURES.map((f, i) => (
                            <li key={i} className={styles.featureItem}>
                                <span className={styles.featureIcon}>{f.icon}</span>
                                <span>{f.text}</span>
                            </li>
                        ))}
                    </ul>

                    <hr className={styles.divider} />

                    {/* Free plan reminder */}
                    <div className={styles.freePlanNote}>
                        <span className={styles.freeTag}>Free plan</span>
                        <span>3 interviews · basic feedback only</span>
                    </div>
                </div>

                {/* Right — Payment Action */}
                <div className={styles.payCard}>
                    <h2 className={styles.payTitle}>Complete your purchase</h2>
                    <p className={styles.paySubtitle}>
                        Sirf ek baar pay karo, hamesha ke liye unlimited access pao.
                    </p>

                    <div className={styles.orderSummary}>
                        <div className={styles.summaryRow}>
                            <span>Unlimited Plan</span>
                            <span>₹499</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>GST / Taxes</span>
                            <span className={styles.included}>Included</span>
                        </div>
                        <hr className={styles.divider} />
                        <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                            <span>Total</span>
                            <span>₹499</span>
                        </div>
                    </div>

                    <button
                        className={styles.btnPrimary}
                        onClick={handlePayment}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className={styles.spinner} />
                                Processing...
                            </>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="1" y="4" width="22" height="16" rx="2" />
                                    <line x1="1" y1="10" x2="23" y2="10" />
                                </svg>
                                Pay ₹499 with Razorpay
                            </>
                        )}
                    </button>

                    {status === 'failed' && (
                        <div className={styles.errorBox}>
                            <strong>Payment fail hua:</strong> {errorMsg}
                        </div>
                    )}

                    <div className={styles.secureNote}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        256-bit SSL encrypted · Secured by Razorpay
                    </div>

                    <div className={styles.paymentMethods}>
                        <span>UPI</span>
                        <span>Cards</span>
                        <span>Net Banking</span>
                        <span>Wallets</span>
                    </div>
                </div>

            </div>
        </div>
    );
}