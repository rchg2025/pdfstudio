import { useState, useEffect } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  QrCode, 
  Copy, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import './SubscriptionModal.css';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export default function SubscriptionModal({ isOpen, onClose, reason }: SubscriptionModalProps) {
  const { user, token, refreshUser, isExpired, remainingDays } = useAuth();
  const { showToast } = useNotification();

  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [selectedPlanKey, setSelectedPlanKey] = useState<string>('plan_365d');
  
  // Bước thanh toán: 'select_plan' | 'qr_payment'
  const [step, setStep] = useState<'select_plan' | 'qr_payment'>('select_plan');
  const [orderData, setOrderData] = useState<any>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchPlansAndBank();
      setStep('select_plan');
      setOrderData(null);
    }
  }, [isOpen]);

  const fetchPlansAndBank = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscription?action=pricing-and-bank');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
        setBankInfo(data.bank || null);
        if (data.plans && data.plans.length > 0) {
          // Mặc định chọn gói 365 ngày hoặc gói phổ biến
          const popular = data.plans.find((p: any) => p.popular) || data.plans[0];
          setSelectedPlanKey(popular.key);
        }
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu gói cước:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!token) {
      showToast('Vui lòng đăng nhập để thực hiện gia hạn', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/subscription?action=create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planKey: selectedPlanKey })
      });

      const data = await res.json();
      if (res.ok) {
        setOrderData(data.order);
        setQrImageUrl(data.qrUrl);
        setBankInfo(data.bank);
        setStep('qr_payment');
      } else {
        showToast(data.message || 'Không thể tạo đơn gia hạn', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi kết nối hệ thống gia hạn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`Đã sao chép ${field}`, 'info');
    setTimeout(() => setCopiedField(''), 2500);
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="sub-modal-backdrop" onClick={onClose}>
      <div className="sub-modal-container animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sub-modal-header">
          <div className="sub-modal-title-box">
            <div className="sub-modal-badge">
              <Crown size={16} /> Gói Dịch Vụ Thành Viên
            </div>
            <h2>{step === 'select_plan' ? 'Gia Hạn & Nâng Cấp Thời Gian Sử Dụng' : 'Thông Tin Thanh Toán Chuyển Khoản'}</h2>
            <p className="sub-modal-subtitle">
              {step === 'select_plan' 
                ? (reason || 'Kích hoạt toàn quyền sử dụng tất cả công cụ số và tính năng độc quyền cho giảng dạy & làm việc.')
                : 'Mở ứng dụng Ngân hàng để quét mã QR hoặc chuyển khoản với nội dung chính xác bên dưới.'}
            </p>
          </div>
          <button className="sub-modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Current status bar */}
        {user && (
          <div className="sub-user-status-strip">
            <div className="sub-status-item">
              <Calendar size={16} className="text-primary" />
              <span>Tài khoản: <strong>{user.email}</strong></span>
            </div>
            <div className="sub-status-item">
              <Clock size={16} className={isExpired ? 'text-danger' : 'text-success'} />
              <span>Hạn dùng: {user.isLifetime ? (
                <strong style={{ color: '#10b981' }}>Trọn đời (Vĩnh viễn)</strong>
              ) : isExpired ? (
                <strong style={{ color: '#ef4444' }}>Đã hết hạn</strong>
              ) : (
                <strong style={{ color: '#2563eb' }}>Còn {remainingDays} ngày (đến {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString('vi-VN') : ''})</strong>
              )}</span>
            </div>
          </div>
        )}

        {/* Step 1: Chọn gói */}
        {step === 'select_plan' && (
          <div className="sub-step-plans">
            <div className="sub-plans-grid">
              {plans.map((p) => {
                const isSelected = selectedPlanKey === p.key;
                return (
                  <div 
                    key={p.key} 
                    className={`sub-plan-card ${isSelected ? 'selected' : ''} ${p.popular ? 'popular' : ''}`}
                    onClick={() => setSelectedPlanKey(p.key)}
                  >
                    {p.popular && <div className="sub-plan-tag">Khuyên dùng ⭐</div>}
                    <div className="sub-plan-head">
                      <h3>{p.title}</h3>
                      <div className="sub-plan-price">
                        <span className="price-num">{formatVND(p.price)}</span>
                      </div>
                      <p className="sub-plan-desc">{p.description}</p>
                    </div>

                    <div className="sub-plan-features">
                      <div className="sub-feature"><Check size={14} className="feat-icon" /> Sử dụng tất cả công cụ không giới hạn</div>
                      <div className="sub-feature"><Check size={14} className="feat-icon" /> Xuất mã nhúng Canva, Slide, Drive</div>
                      <div className="sub-feature"><Check size={14} className="feat-icon" /> Thi trắc nghiệm & Lưu trữ Cloud</div>
                      <div className="sub-feature"><Check size={14} className="feat-icon" /> Tạo khung ảnh & Chia sẻ hàng loạt</div>
                      <div className="sub-feature"><Check size={14} className="feat-icon" /> Hỗ trợ kỹ thuật 24/7</div>
                    </div>

                    <div className="sub-plan-action">
                      <button 
                        type="button" 
                        className={`sub-select-btn ${isSelected ? 'btn-selected' : ''}`}
                      >
                        {isSelected ? 'Đang chọn gói này' : 'Chọn gói'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sub-footer-action">
              <div className="sub-guarantee">
                <ShieldCheck size={18} className="text-success" />
                <span>Kích hoạt tự động nhanh chóng sau khi quản trị viên xác nhận chuyển khoản.</span>
              </div>
              <button 
                className="btn btn-primary sub-next-btn" 
                onClick={handleCreateOrder}
                disabled={loading}
              >
                {loading ? 'Đang khởi tạo...' : (
                  <>Tiếp tục thanh toán <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Quét mã QR chuyển khoản */}
        {step === 'qr_payment' && orderData && (
          <div className="sub-step-qr">
            <div className="sub-qr-layout">
              {/* QR Code Container */}
              <div className="sub-qr-image-wrapper">
                <div className="sub-qr-box">
                  <img src={qrImageUrl} alt="VietQR Thanh toán" className="vietqr-img" />
                </div>
                <div className="sub-qr-hint">
                  <QrCode size={16} /> Mở App Ngân Hàng quét mã để chuyển khoản nhanh với nội dung tự động điền.
                </div>
              </div>

              {/* Chi tiết chuyển khoản */}
              <div className="sub-qr-details">
                <div className="sub-order-banner">
                  <div className="sub-order-plan-name">{orderData.planTitle}</div>
                  <div className="sub-order-amount">{formatVND(orderData.amount)}</div>
                </div>

                <div className="sub-detail-rows">
                  <div className="sub-detail-row">
                    <span className="detail-label">Ngân hàng:</span>
                    <span className="detail-val font-semibold">{bankInfo?.bankId}</span>
                  </div>

                  <div className="sub-detail-row">
                    <span className="detail-label">Số tài khoản:</span>
                    <div className="detail-val-copy">
                      <span className="font-mono font-bold text-primary">{bankInfo?.bankAccountNo}</span>
                      <button 
                        type="button" 
                        className="copy-chip-btn"
                        onClick={() => copyToClipboard(bankInfo?.bankAccountNo, 'Số tài khoản')}
                      >
                        {copiedField === 'Số tài khoản' ? <CheckCircle2 size={14} className="text-success" /> : <Copy size={14} />}
                        {copiedField === 'Số tài khoản' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  <div className="sub-detail-row">
                    <span className="detail-label">Chủ tài khoản:</span>
                    <span className="detail-val font-semibold">{bankInfo?.bankAccountName}</span>
                  </div>

                  <div className="sub-detail-row">
                    <span className="detail-label">Số tiền:</span>
                    <div className="detail-val-copy">
                      <span className="font-mono font-bold text-emerald-600">{formatVND(orderData.amount)}</span>
                      <button 
                        type="button" 
                        className="copy-chip-btn"
                        onClick={() => copyToClipboard(String(orderData.amount), 'Số tiền')}
                      >
                        {copiedField === 'Số tiền' ? <CheckCircle2 size={14} className="text-success" /> : <Copy size={14} />}
                        {copiedField === 'Số tiền' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  <div className="sub-detail-row highlight-row">
                    <span className="detail-label font-bold text-red-600">Nội dung CK:</span>
                    <div className="detail-val-copy">
                      <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {orderData.transferCode}
                      </span>
                      <button 
                        type="button" 
                        className="copy-chip-btn copy-highlight"
                        onClick={() => copyToClipboard(orderData.transferCode, 'Nội dung chuyển khoản')}
                      >
                        {copiedField === 'Nội dung chuyển khoản' ? <CheckCircle2 size={14} className="text-success" /> : <Copy size={14} />}
                        {copiedField === 'Nội dung chuyển khoản' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sub-alert-box">
                  <AlertCircle size={18} className="text-amber-600" />
                  <span>
                    <strong>Lưu ý:</strong> Vui lòng giữ nguyên nội dung chuyển khoản <strong>{orderData.transferCode}</strong> để hệ thống duyệt và kích hoạt tự động chính xác cho tài khoản của bạn.
                  </span>
                </div>

                <div className="sub-action-buttons">
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setStep('select_plan')}
                  >
                    Đổi gói khác
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => {
                      showToast('Yêu cầu gia hạn đã được ghi nhận. Quản trị viên sẽ kích hoạt gói cho bạn trong giây lát!', 'success');
                      refreshUser();
                      onClose();
                    }}
                  >
                    <CheckCircle2 size={18} /> Tôi Đã Chuyển Khoản Xong
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
