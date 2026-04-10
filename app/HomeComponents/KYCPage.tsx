/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  RotateCcw,
  ArrowLeft,
  CheckCircle,
  Upload,
  Camera,
} from "lucide-react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { useUser } from "../UserContext";
import { kycService } from "../services/apis";
import * as faceapi from "face-api.js";

const MODEL_URL =
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

const AdminKYC = () => {
  const { user, setUser } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(2);
  const [loading, setLoading] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [livenessStatus, setLivenessStatus] = useState("idle"); // idle, active, success
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [instruction, setInstruction] = useState("Align your face");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [isResolving, setIsResolving] = useState(false);

  const [formData, setFormData] = useState({
    cacNumber: "",
    tinNumber: "",
    adminFullName: "",
    ninNumber: "",
    adminRole: "",
    residentialAddress: "",
    authorizingBodyName: "",
    consent_given: false,
    accountNumber: "",
    bankCode: "",
    accountName: "",
    bankName: "",
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    cacCert: null,
    estateUtility: null,
    authLetter: null,
    adminUtility: null,
    signature: null,
    referenceSelfie: null,
  });

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch("https://api.paystack.co/bank", {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY}`,
          },
        });
        const data = await res.json();
        setBanks(data.data);
      } catch (err) {
        console.error("Failed to fetch banks");
      }
    };
    fetchBanks();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (step === 3 && livenessStatus === "active") {
      const initLiveness = async () => {
        setInstruction("Loading detection engine...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);

        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) videoRef.current.srcObject = stream;

        interval = setInterval(async () => {
          if (!videoRef.current) return;

          const detection = await faceapi
            .detectSingleFace(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 160,
                scoreThreshold: 0.5,
              }),
            )
            .withFaceLandmarks();

          if (detection) {
            handleDetectionLogic(detection);
          } else {
            setInstruction("No face detected. Move into view.");
          }
        }, 800);
      };

      initLiveness();
    }

    return () => {
      if (interval) clearInterval(interval);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, [step, livenessStatus]);

  const captureSnap = () => {
    if (!videoRef.current) return "";
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.7);
  };

  const handleDetectionLogic = (detection: any) => {
    const landmarks = detection.landmarks;
    const nose = landmarks.getNose();
    const jaw = landmarks.getJawOutline();

    const noseX = nose[6].x;
    const leftJawX = jaw[0].x;
    const rightJawX = jaw[16].x;

    const faceWidth = rightJawX - leftJawX;
    const nosePos = (noseX - leftJawX) / faceWidth;

    setCapturedImages((prev) => {
      if (prev.length === 0 && nosePos > 0.35 && nosePos < 0.65) {
        setInstruction("Center captured! Now turn LEFT.");
        return [captureSnap()];
      }

      // 2. Left: nose is closer to the left jaw
      if (prev.length === 1 && nosePos < 0.35) {
        setInstruction("Left captured! Now turn RIGHT.");
        return [...prev, captureSnap()];
      }

      // 3. Right: nose is closer to the right jaw
      if (prev.length === 2 && nosePos > 0.65) {
        setInstruction("Success! Capturing final snap.");
        setLivenessStatus("success");
        return [...prev, captureSnap()];
      }
      return prev;
    });
  };

  const handleBackNavigation = () => {
    if (step <= 1) {
      router.push("/home/dashboard");
    } else {
      const newStep = step - 1;
      // 1. Update local UI state
      setStep(newStep);

      if (user) {
        setUser({
          ...user,
          verification_step: newStep,
        });
      }
    }
  };

  const resolveAccount = async (accountNumber: string, bankCode: string) => {
    if (accountNumber.length === 10 && bankCode) {
      setIsResolving(true);
      try {
        const res = await fetch(
          `/api/kyc/resolve-bank?accountNumber=${accountNumber}&bankCode=${bankCode}`,
        );

        const data = await res.json();
        console.log("Account resolution data:", data);

        if (data.status) {
          setFormData((prev) => ({
            ...prev,
            accountName: data.data.account_name,
          }));
        } else {
          setFormData((prev) => ({ ...prev, accountName: "Invalid Account" }));
        }
      } catch (err) {
        console.error("Resolution error", err);
        setFormData((prev) => ({
          ...prev,
          accountName: "Error connecting to server",
        }));
      } finally {
        setIsResolving(false);
      }
    }
  };

  const handleReset = async () => {
    if (
      !confirm("Are you sure? This will wipe all uploaded documents and data.")
    )
      return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/kyc/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user?.id, estateId: user?.estate_id }),
      });
      const result = await res.json();
      if (result.success) {
        setStep(0);
        setFiles({
          cacCert: null,
          estateUtility: null,
          authLetter: null,
          adminUtility: null,
        });
        setFormData({
          cacNumber: "",
          tinNumber: "",
          adminFullName: "",
          ninNumber: "",
          adminRole: "",
          residentialAddress: "",
          authorizingBodyName: "",
          consent_given: false,
          accountNumber: "",
          bankCode: "",
          accountName: "",
          bankName: "",
        });

        if (user) {
          setUser({
            ...user,
            verification_step: 0,
          });
        }
      }
    } catch (error) {
      alert("Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressed = await imageCompression(file, options);
      setFiles((prev) => ({ ...prev, [key]: compressed }));
    }
  };

  const onSaveEstate = async () => {
    if (!files.cacCert || !formData.cacNumber)
      return alert("CAC number and Certificate are required");
    setLoading(true);
    const result = await kycService.saveEstateDocs({
      cacNumber: formData.cacNumber,
      tinNumber: formData.tinNumber,
      cacCert: files.cacCert!,
      estateUtility: files.estateUtility,
    });
    if (result.success) {
      setStep(2);

      if (user) {
        setUser({
          ...user,
          verification_step: 2,
        });
      }
    } else alert(result.message);
    setLoading(false);
  };

  const onSaveIdentity = async () => {
    if (
      !files.authLetter ||
      !formData.ninNumber ||
      !files.referenceSelfie ||
      !files.signature ||
      !formData.authorizingBodyName ||
      !formData.accountNumber || 
      !formData.bankCode || 
      !formData.accountName ||
      formData.accountName === "Invalid Account"
    )
      return alert(
        "All identity fields and a valid settlement bank account are required.",
      );

    setLoading(true);
    const result = await kycService.saveAdminIdentity({
      ...formData,
      authLetter: files.authLetter!,
      adminUtility: files.adminUtility,
      signature: files.signature,
      selfie: files.referenceSelfie,
    });
    if (result.success) {
      setStep(3);
      if (user) {
        setUser({
          ...user,
          verification_step: 3,
        });
      }
    } else alert(result.message);
    setLoading(false);
  };

  // const checkVerificationStatus = async () => {
  //   try {
  //     const res = await fetch("/api/kyc/status");
  //     const data = await res.json();

  //     if (data.status === "completed") {
  //       setStep(4);
  //       if (user) setUser({ ...user, verification_step: 4 });
  //     } else if (data.status === "failed") {
  //       alert("Identity verification failed. Please try again.");
  //       setStep(3);
  //       setLoading(false);
  //     } else {
  //       setTimeout(checkVerificationStatus, 3000);
  //     }
  //   } catch (err) {
  //     console.error("Status check failed", err);
  //   }
  // };

  const submitFinalKYC = async () => {
    if (capturedImages.length < 3) {
      return alert("Please complete all 3 liveness snapshots.");
    }

    setLoading(true);
    try {
      const res = await kycService.finalizeKYC({
        selfiePhotos: capturedImages, // Only sending the base64 array
      });

      if (res.success) {
        setStep(4);
      } else {
        alert(res.message || "Submission failed.");
      }
    } catch (err) {
      alert("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-2xl rounded-2xl border">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-6">
        {step < 4 && (
          <button
            onClick={handleBackNavigation}
            className="flex items-center gap-2 text-gray-500 font-bold hover:text-indigo-600 transition"
          >
            <ArrowLeft size={20} /> BACK
          </button>
        )}
        {step > 1 && step < 4 && (
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 p-2 rounded-lg transition disabled:opacity-50"
          >
            <RotateCcw size={20} /> {loading ? "RESETTING..." : "START OVER"}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 mx-1 rounded-full ${step >= s ? "bg-indigo-600" : "bg-gray-200"}`}
            />
          ))}
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase">
          Step {step > 3 ? 3 : step} of 3
        </p>
      </div>

      {/* STEP 0: INTRODUCTION */}
      {step === 0 && (
        <div className="text-center py-6">
          <h2 className="text-3xl font-black text-indigo-900 mb-4">
            Verification Required
          </h2>
          <p className="mb-8 text-gray-600">
            Complete KYC to enable the estate wallet and collection features.
          </p>
          <button
            onClick={() => setStep(1)}
            className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg"
          >
            Begin Verification
          </button>
        </div>
      )}

      {/* STEP 1: ESTATE DOCS */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-300 flex flex-col gap-3">
          <h3 className="text-xl font-bold italic text-indigo-900 underline">
            Step 1: Estate & Business Docs
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="CAC Number"
              className="border-2 p-3 rounded-lg focus:border-indigo-500 outline-none"
              onChange={(e) =>
                setFormData({ ...formData, cacNumber: e.target.value })
              }
            />
            <input
              placeholder="TIN Number"
              className="border-2 p-3 rounded-lg focus:border-indigo-500 outline-none"
              onChange={(e) =>
                setFormData({ ...formData, tinNumber: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FileUploadField
              label="CAC Certificate"
              onChange={(e) => handleFileUpload(e, "cacCert")}
              hasFile={!!files.cacCert}
            />
            <FileUploadField
              label="Estate Utility Bill"
              onChange={(e) => handleFileUpload(e, "estateUtility")}
              hasFile={!!files.estateUtility}
            />
          </div>
          <button
            disabled={loading}
            onClick={onSaveEstate}
            className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition"
          >
            {loading ? "Verifying Business Details..." : "Save & Continue"}
          </button>
        </div>
      )}

      {/* STEP 2: ADMIN IDENTITY + AUTH */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-300 flex flex-col gap-3">
          <h3 className="text-xl font-bold italic text-indigo-900 underline">
            Step 2: Admin Identity & Authorization
          </h3>
          <div className="overflow-y-auto h-[50vh] space-y-4 p-2">
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Full Name (as on NIN)"
                className="border-2 p-3 rounded-lg"
                onChange={(e) =>
                  setFormData({ ...formData, adminFullName: e.target.value })
                }
              />
              <input
                placeholder="NIN Number"
                maxLength={11}
                className="border-2 p-3 rounded-lg"
                onChange={(e) =>
                  setFormData({ ...formData, ninNumber: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Role in Estate e.g Chairman....)"
                className="border-2 p-3 rounded-lg"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    adminRole: e.target.value,
                  })
                }
              />
              <input
                placeholder="Authorizing Body (e.g. HOA)"
                className="border-2 p-3 rounded-lg"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    authorizingBodyName: e.target.value,
                  })
                }
              />
            </div>
            <textarea
              placeholder="Residential Address"
              className="w-full border-2 p-3 rounded-lg"
              onChange={(e) =>
                setFormData({ ...formData, residentialAddress: e.target.value })
              }
            />
            <div className="space-y-4 border-t pt-4 mt-4">
              <h4 className="text-sm font-bold text-indigo-900 uppercase">
                Settlement Bank Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  className="border-2 p-3 rounded-lg bg-white"
                  onChange={(e) => {
                    const selectedBank = banks.find(
                      (b) => b.code === e.target.value,
                    );
                    setFormData({
                      ...formData,
                      bankCode: e.target.value,
                      bankName: selectedBank?.name || "",
                    });
                    if (formData.accountNumber.length === 10) {
                      resolveAccount(formData.accountNumber, e.target.value);
                    }
                  }}
                >
                  <option value="">Select Bank</option>
                  {banks.map((bank, index) => (
                    <option key={`${bank.code}-${index}`} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Account Number"
                  maxLength={10}
                  className="border-2 p-3 rounded-lg"
                  value={formData.accountNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");

                    setFormData({ ...formData, accountNumber: val });

                    if (val.length === 10 && formData.bankCode) {
                      resolveAccount(val, formData.bankCode);
                    } else if (val.length < 10) {
                      setFormData((prev) => ({ ...prev, accountName: "" }));
                    }
                  }}
                />
              </div>

              {(formData.accountName || isResolving) && (
                <div
                  className={`p-3 rounded-lg text-sm font-bold mt-2 animate-in fade-in duration-300 ${
                    formData.accountName === "Invalid Account"
                      ? "bg-red-50 text-red-600"
                      : "bg-indigo-50 text-indigo-700" // Using Indigo for a "neutral" loading state
                  }`}
                >
                  {isResolving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Verifying Account...
                    </div>
                  ) : (
                    `Account Name: ${formData.accountName}`
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FileUploadField
                label="Authorization Letter"
                onChange={(e) => handleFileUpload(e, "authLetter")}
                hasFile={!!files.authLetter}
              />
              <FileUploadField
                label="Personal Utility Bill"
                onChange={(e) => handleFileUpload(e, "adminUtility")}
                hasFile={!!files.adminUtility}
              />
              <FileUploadField
                label="Official Passport/Selfie"
                onChange={(e) => handleFileUpload(e, "referenceSelfie")}
                hasFile={!!files.referenceSelfie}
              />
              <div className="mt-4">
                <FileUploadField
                  label="Upload Scanned Signature"
                  onChange={(e) => handleFileUpload(e, "signature")}
                  hasFile={!!files.signature}
                />
              </div>
            </div>
          </div>
          <button
            disabled={loading}
            onClick={onSaveIdentity}
            className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition"
          >
            {loading ? "Saving Identity..." : "Continue to Selfie"}
          </button>
        </div>
      )}

      {/* STEP 3: BIOMETRIC VERIFICATION */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <h3 className="text-xl font-bold italic text-indigo-900 underline text-center">
            Step 3: Biometric Liveness Check
          </h3>

          {!hasConsent ? (
            <div className="bg-indigo-50 p-6 rounded-2xl border-2 border-indigo-100 space-y-4">
              <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                <CheckCircle size={20} className="text-indigo-600" />
                Biometric Data Consent
              </h4>

              <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
                <p>
                  To secure the <strong>GateMan</strong> ecosystem, we use
                  facial recognition to verify your identity. By continuing, you
                  agree to:
                </p>

                <ul className="list-disc ml-5 space-y-1">
                  <li>
                    The collection of 3 selfie snapshots for manual
                    verification.
                  </li>

                  <li>
                    Storage of these images in our secure, encrypted server for
                    KYC audit purposes.
                  </li>

                  <li>
                    Verification of these images against your provided
                    Government ID.
                  </li>
                </ul>

                <p className="font-semibold text-indigo-800">
                  Your data is never shared with third parties and is used
                  solely for estate security.
                </p>
              </div>

              <label className="flex items-center gap-3 p-4 bg-white rounded-xl border cursor-pointer hover:bg-indigo-50 transition">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-indigo-600"
                  checked={formData.consent_given}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      consent_given: e.target.checked,
                    })
                  }
                />

                <span className="text-sm font-bold text-gray-700">
                  I agree to the collection and processing of my biometric data.
                </span>
              </label>

              <button
                disabled={!formData.consent_given}
                onClick={() => {
                  setHasConsent(true);

                  if (user) setUser({ ...user, consent_given: true });
                }}
                className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg disabled:bg-gray-300 disabled:shadow-none transition"
              >
                Confirm & Proceed
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="relative bg-black rounded-2xl aspect-video overflow-hidden shadow-2xl border-4 border-indigo-600">
                {livenessStatus === "idle" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-6">
                    <Camera size={48} className="mb-4 text-indigo-400" />

                    <p className="mb-4">
                      Consent Received. Please center your face.
                    </p>

                    <button
                      onClick={() => setLivenessStatus("active")}
                      className="bg-indigo-600 px-8 py-3 rounded-xl font-bold"
                    >
                      Start Camera
                    </button>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                )}

                {livenessStatus === "active" && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <div className="bg-white/90 px-6 py-2 rounded-full font-bold text-indigo-600 animate-pulse">
                      {instruction}
                    </div>
                  </div>
                )}
              </div>

              {/* Snaps Grid */}

              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-gray-100 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden"
                  >
                    {capturedImages[i] ? (
                      <img
                        src={capturedImages[i]}
                        className="object-cover w-full h-full"
                        alt="Snap"
                      />
                    ) : (
                      <span className="text-[10px] text-gray-400">
                        Snap {i + 1}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button
                disabled={loading || capturedImages.length < 3}
                onClick={submitFinalKYC}
                className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg disabled:bg-gray-400 transition"
              >
                {loading
                  ? "Processing Submission..."
                  : "Submit for Manual Approval"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: SUCCESS */}
      {step === 4 && (
        <div className="text-center py-12 space-y-6 animate-in zoom-in duration-500 flex flex-col gap-3">
          <CheckCircle className="text-green-500 mx-auto" size={100} />
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-indigo-900">
              Application Received!
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Your documents are under review. We&apos;ll notify you once your
              wallet and subaccount are active. Verification usually takes 24-48
              hours
            </p>
          </div>
          <button
            onClick={() => router.push("/home/dashboard")}
            className="bg-indigo-600 text-white px-12 py-4 rounded-xl font-bold shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

const FileUploadField = ({
  label,
  onChange,
  hasFile,
}: {
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasFile: boolean;
}) => (
  <label
    className={`block p-4 border-2 border-dashed rounded-xl cursor-pointer transition ${hasFile ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-indigo-400"}`}
  >
    <div className="flex flex-col items-center gap-1">
      <Upload
        size={20}
        className={hasFile ? "text-green-500" : "text-gray-400"}
      />
      <span className="text-[10px] font-bold text-gray-500 uppercase">
        {label}
      </span>
      {hasFile && (
        <span className="text-[10px] text-green-600 font-bold italic">
          Attached
        </span>
      )}
    </div>
    <input
      type="file"
      className="hidden"
      onChange={onChange}
      accept="image/*,.pdf"
    />
  </label>
);

export default AdminKYC;
