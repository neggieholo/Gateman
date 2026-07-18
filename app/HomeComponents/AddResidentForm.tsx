/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  UserPlus,
  Home,
  Mail,
  Phone,
  Camera,
  FileText,
  Upload,
} from "lucide-react";
import { useUser } from "../UserContext";
import toast from "react-hot-toast";
import { deleteStaleCloudinaryAsset, getCloudinaryUrl } from "../services/apis";
import "react-phone-number-input/style.css";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";

interface BlockNode {
  block: string;
  units: string[];
}

interface ContractFileMeta {
  uri: string;
  name: string;
  mimeType: string;
  blockTarget: string;
  unitTarget: string;
}

interface AddResidentFormProps {
  onSubmitSuccess: () => void;
}

export default function AddResidentForm({
  onSubmitSuccess,
}: AddResidentFormProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Custom Selection Additions
  const [selfie, setSelfie] = useState<File | string | null>(null);
  const [includeContracts, setIncludeContracts] = useState(false);
  const [contractFiles, setContractFiles] = useState<
    (ContractFileMeta | null)[]
  >([]);

  const [locations, setLocations] = useState<BlockNode[]>([
    { block: "", units: [""] },
  ]);
  const { user } = useUser();
  const estateId = user?.estate_id;

  useEffect(() => {
    const list: (ContractFileMeta | null)[] = [];
    locations.forEach((bObj) => {
      bObj.units.forEach((uName) => {
        const existing = contractFiles.find(
          (c) => c?.blockTarget === bObj.block && c?.unitTarget === uName,
        );
        list.push(existing || null);
      });
    });
    setContractFiles(list);
  }, [locations]);

  // Nested structural state mechanics
  const updateBlockName = (bIndex: number, text: string) => {
    const next = [...locations];
    next[bIndex].block = text;
    setLocations(next);
  };

  const updateUnitName = (bIndex: number, uIndex: number, text: string) => {
    const next = [...locations];
    next[bIndex].units[uIndex] = text;
    setLocations(next);
  };

  const addUnitToBlock = (bIndex: number) => {
    const next = [...locations];
    next[bIndex].units.push("");
    setLocations(next);
  };

  const removeUnitFromBlock = (bIndex: number, uIndex: number) => {
    const next = [...locations];
    if (next[bIndex].units.length === 1) {
      removeBlockNode(bIndex);
    } else {
      next[bIndex].units.splice(uIndex, 1);
      setLocations(next);
    }
  };

  const addBlockNode = () => {
    setLocations([...locations, { block: "", units: [""] }]);
  };

  const removeBlockNode = (bIndex: number) => {
    if (locations.length === 1) return;
    setLocations(locations.filter((_, idx) => idx !== bIndex));
  };

  const handleSelfieChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Create and apply the local preview immediately
    const localPreviewUrl = URL.createObjectURL(file);
    setSelfie(localPreviewUrl);

    try {
      const uploadedUrl = await getCloudinaryUrl(file, "image");

      if (uploadedUrl) {
        // 2. Clean up the blob URL ONLY right before swapping to the cloud URL
        URL.revokeObjectURL(localPreviewUrl);
        setSelfie(uploadedUrl);
        toast.success("Avatar staged securely!");
      } else {
        toast.error("Avatar upload failed. Reverting changes.");
        URL.revokeObjectURL(localPreviewUrl); // Clean up on failure
        setSelfie(null);
      }
    } catch (err) {
      console.error("Avatar handling layout exception:", err);
      toast.error("An error occurred during image staging execution.");
      URL.revokeObjectURL(localPreviewUrl); // Clean up on exception
      setSelfie(null);
    }
  };

  const handlePhoneChange = (value: string | undefined) => {
    const phoneValue = value || "";
    setPhone(phoneValue);
  };

  const handleContractFileChange = async (
    flatTargetIndex: number,
    bName: string,
    uName: string,
    file: File | null,
  ) => {
    if (!file) return;
    const localPreviewUrl = URL.createObjectURL(file);
    const rawMimeType = file.type;

    const type = rawMimeType.includes("pdf") ? "document" : "image";

    try {
      const uploadedUrl = await getCloudinaryUrl(file, type);

      if (uploadedUrl) {
        // Clean up local binary blob memory safely
        URL.revokeObjectURL(localPreviewUrl);

        setContractFiles((prevContracts) => {
          const nextContracts = [...prevContracts];
          nextContracts[flatTargetIndex] = {
            uri: uploadedUrl,
            name: file.name,
            mimeType: file.type,
            blockTarget: bName,
            unitTarget: uName,
          };
          return nextContracts;
        });

        const existingFile = contractFiles[flatTargetIndex];
        if (existingFile && existingFile.uri) {
          deleteStaleCloudinaryAsset(existingFile.uri).catch((err) =>
            console.error("Background file cleanup error:", err),
          );
        }

        toast.success(
          `Contract for ${bName} - ${uName} uploaded successfully!`,
        );
      } else {
        toast.error("Unable to save contract file");
        URL.revokeObjectURL(localPreviewUrl);
      }
    } catch (err) {
      console.error("Contract handling layout exception:", err);
      toast.error("An error occurred during image staging execution.");
      URL.revokeObjectURL(localPreviewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidPhoneNumber(phone)) {
      toast.error(
        "Invalid phone number format. Please check the number and country code.",
      );
      return;
    }
    setLoading(true);

    try {
      // 1. Construct a clean, native JSON object directly
      const payload = {
        estateId: estateId || "",
        name: name,
        email: email,
        phone: phone,
        locations: locations, // Pass your locations array/object cleanly here

        // Selfie is a raw Cloudinary URL string reference
        selfie: selfie || null,

        // Filter and append contract array payload safely
        rentContract: includeContracts
          ? contractFiles
              .filter(
                (cItem): cItem is NonNullable<typeof cItem> =>
                  !!(cItem && cItem.uri),
              )
              .map((cItem) => ({
                uri: cItem.uri,
                name: cItem.name,
                type: cItem.mimeType,
              }))
          : [],
      };

      console.log("Sending Manual Add Clean Payload:", payload);

      // 2. Submit via genuine application/json mapping
      const response = await fetch(
        `${baseUrl}/api/admin/residents/manual-add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload), // Convert the native object to valid JSON text
          credentials: "include",
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success(
          "Resident successfully introduced into system directory.",
        );
        onSubmitSuccess();
      } else {
        throw new Error(data.message || "Failed allocating manually.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected processing error transpired.");
    } finally {
      setLoading(false);
    }
  };

  // Compute total dynamic allocations expected versus actual uploads
  const totalUnitsCount = locations.reduce((acc, b) => acc + b.units.length, 0);
  const totalUploadedContracts = Object.keys(contractFiles).length;

  const isValid =
    name.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    locations.every(
      (b) => b.block.trim() !== "" && b.units.every((u) => u.trim() !== ""),
    ) &&
    (!includeContracts || totalUploadedContracts === totalUnitsCount);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-full max-h-full p-4 font-sans min-w-0 overflow-hidden">
      {/* Header View Block */}
      <div className="border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0 min-w-0 rounded-t-xl overflow-hidden p-4">
        <div>
          <h3 className="text-lg sm:text-xl font-montserrat font-black text-slate-900 flex items-center gap-2">
            <UserPlus size={22} className="text-indigo-600" /> Manual Resident
            Inclusion
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Directly register and authorize a tenant without going through the
            public application sequence.
          </p>
        </div>
      </div>

      {/* Main Core Scrollable Workspace */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar min-w-0"
      >
        {/* Profile Picture / Selfie Section at top */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-2xl">
          <h4 className="text-[12px] font-montserrat font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Camera size={14} /> Resident Profile Biometric
          </h4>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
              {selfie ? (
                <img
                  src={selfie}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera size={24} className="text-slate-400" />
              )}
            </div>
            <label className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg shadow-xs text-xs font-bold text-slate-700 transition-colors">
              <span>
                {selfie ? "Change Selfie Photo" : "Upload Verification Selfie"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSelfieChange}
              />
            </label>
            {selfie && (
              <span className="text-xs text-emerald-600 font-medium">
                ✓ Ready
              </span>
            )}
          </div>
        </div>

        {/* Baseline Profile Matrix Blocks */}
        <div className="space-y-4">
          <h4 className="text-[14px] font-montserrat font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-indigo-500 outline-none text-slate-700 font-medium transition-colors"
                />
                <UserPlus
                  size={16}
                  className="absolute left-3 top-3.5 text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="johndoe@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-indigo-500 outline-none text-slate-700 font-medium transition-colors"
                />
                <Mail
                  size={16}
                  className="absolute left-3 top-3.5 text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Phone Number
              </label>
              <div className="relative w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus-within:border-indigo-500 transition-colors h-[42px] flex items-center">
                <PhoneInput
                  international
                  defaultCountry="NG"
                  placeholder="0803 123 4567"
                  value={phone === "Not set" ? undefined : phone}
                  onChange={handlePhoneChange}
                  className="flex items-center w-full react-phone-number-input-custom"
                  inputClassName="w-full outline-none border-none p-0 text-sm text-slate-700 font-medium bg-transparent focus:ring-0 ml-2"
                />
                <Phone
                  size={16}
                  className="absolute left-3 top-3.5 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status Overrides */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 max-w-2xl">
          <h5 className="text-[14px] font-montserrat font-black text-slate-400 uppercase tracking-wider">
            Account Security &amp; Verification
          </h5>

          <div className="flex gap-3 pt-1 items-start">
            {/* Clean, descriptive secure shield/key indicator icon */}
            <div className="mt-0.5 p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">
                Implicit Multi-Channel Verification Active
              </span>
              <p className="text-[12px] text-slate-500 leading-relaxed mt-0.5">
                To verify new profiles securely without traditional OTP
                roadblocks, GateMan will automatically generate a temporary
                12-character security key. The first half is dispatched to the
                resident&apos;s **email address**, and the second half is sent
                to their **phone number**. Combining both halves sequentially
                forms their initial app access credentials.
              </p>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Dynamic Location Map Space */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-[14px] font-montserrat font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Home size={14} /> Assigned Unit Locations
            </h4>
          </div>

          <div className="space-y-4">
            {locations.map((blockNode, bIdx) => (
              <div
                key={bIdx}
                className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-4 relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded uppercase tracking-wide">
                    Block Domain Cluster #{bIdx + 1}
                  </span>
                  {locations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBlockNode(bIdx)}
                      className="text-red-500 hover:text-red-700 p-1 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="max-w-md">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Block Identifier
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Block C"
                    value={blockNode.block}
                    onChange={(e) => updateBlockName(bIdx, e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none text-slate-700 font-semibold bg-white data-slot"
                  />
                </div>

                <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Assigned Flats/Units
                  </label>

                  {blockNode.units.map((unitNode, uIdx) => (
                    <div
                      key={uIdx}
                      className="flex items-center gap-2 max-w-md"
                    >
                      <input
                        type="text"
                        required
                        placeholder={`e.g. Flat ${uIdx + 1}`}
                        value={unitNode}
                        onChange={(e) =>
                          updateUnitName(bIdx, uIdx, e.target.value)
                        }
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500 outline-none text-slate-700 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeUnitFromBlock(bIdx, uIdx)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addUnitToBlock(bIdx)}
                    className="flex items-center gap-1 text-[11px] font-montserrat font-bold text-indigo-600 bg-white border border-slate-200 hover:bg-indigo-50 px-2.5 py-1.5 rounded-md transition-colors mt-2"
                  >
                    <Plus size={12} /> Add Unit to this Block
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addBlockNode}
            className="w-full flex items-center justify-center gap-1.5 p-4 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-xl bg-indigo-50/20 text-indigo-600 text-xs font-montserrat font-black transition-all uppercase tracking-wider"
          >
            <Plus size={16} /> Add Another Separate Block Allocation
          </button>
        </div>

        <hr className="border-slate-100" />

        {/* Include Lease Contracts Feature Toggles */}
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group select-none bg-slate-50 p-4 rounded-xl border border-slate-100 max-w-2xl">
            <input
              type="checkbox"
              checked={includeContracts}
              onChange={(e) => setIncludeContracts(e.target.checked)}
              className="w-4 h-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                Include Contract Agreements Images
              </span>
              <span className="text-[12px] text-slate-400">
                Opens secure multi-allocation verification slots matching
                assigned property nodes.
              </span>
            </div>
          </label>

          {includeContracts && (
            <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 space-y-4 max-w-2xl animate-fadeIn">
              <h5 className="text-[12px] font-montserrat font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} /> Tenancy Attachment Indexing
              </h5>

              <div className="space-y-3">
                {/* FIXED: Wrapped in parentheses and added () at the end to execute it immediately */}
                {(() => {
                  let flatUnitCounter = 0;
                  return locations.map((blockNode) =>
                    blockNode.units.map((unitNode) => {
                      const currentFlatIndex = flatUnitCounter;
                      flatUnitCounter++;

                      const currentBlockLabel = blockNode.block;
                      const currentUnitLabel = unitNode;
                      // FIXED: Using single source of truth index for reading state
                      const selectedFile = contractFiles[currentFlatIndex];

                      return (
                        <div
                          key={`${currentBlockLabel}-${currentUnitLabel}-${currentFlatIndex}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-slate-200 rounded-xl gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-indigo-500" />
                            <span className="font-semibold text-slate-700 uppercase tracking-wide">
                              Location: {currentBlockLabel} ➔ {currentUnitLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {selectedFile && (
                              <div className="flex items-center gap-1.5 max-w-xs">
                                <span
                                  className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider text-white ${
                                    selectedFile.mimeType?.includes("pdf")
                                      ? "bg-red-500"
                                      : "bg-blue-500"
                                  }`}
                                >
                                  {selectedFile.mimeType?.includes("pdf")
                                    ? "PDF"
                                    : "IMG"}
                                </span>
                                <span className="text-emerald-600 font-medium truncate max-w-35">
                                  {selectedFile.name}
                                </span>
                              </div>
                            )}

                            <label className="flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg transition-colors shadow-xs">
                              <Upload size={12} />
                              <span>
                                {selectedFile ? "Replace" : "Select Image/PDF"}
                              </span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) =>
                                  handleContractFileChange(
                                    currentFlatIndex,
                                    currentBlockLabel,
                                    currentUnitLabel,
                                    e.target.files ? e.target.files[0] : null,
                                  )
                                }
                              />
                            </label>
                          </div>
                        </div>
                      );
                    }),
                  );
                })()}{" "}
                {/* 👈 FIXED: Invocation operators */}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Submission Control Bar */}
        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            className="px-5 py-2.5 border border-slate-200 text-slate-500 font-montserrat font-bold hover:bg-slate-50 rounded-lg transition-colors text-xs uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || loading}
            className={`px-6 py-2.5 text-white rounded-lg font-montserrat font-black transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider shadow-md ${
              isValid && !loading
                ? "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                : "bg-slate-300 cursor-not-allowed opacity-70"
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <>
                <UserPlus size={14} /> <span>Save New Resident</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
