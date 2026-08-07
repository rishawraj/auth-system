import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from "@tanstack/react-router";
import { PenIcon } from "lucide-react";
import { ChangeEvent, FormEvent, useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { CropperProps, Area } from "react-easy-crop";

import NavBar from "../../../components/NavBar-test";
import { User } from "../../../types/auth";
import { fetchWithAuth } from "../../../utils/api";
import { getCroppedCircularImage } from "../../../utils/cropImage";

interface EditResponse {
  status?: string;
  message: string;
  user: User;
}

// Cast to bypass the class component type mismatch
const EasyCropper = Cropper as unknown as React.FC<
  Partial<CropperProps> & {
    image: string;
    crop: CropperProps["crop"];
    onCropChange: CropperProps["onCropChange"];
  }
>;

export const Route = createFileRoute("/_auth/profile/edit")({
  loader: async () => {
    type ProfileResponse = {
      user: User;
    };

    try {
      const data = await fetchWithAuth<ProfileResponse>("/profile");
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const profile = useLoaderData({ from: "/_auth/profile/edit" });

  const navigate = useNavigate();
  const isOauthUser = profile?.user.oauth_provider ? true : false;

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProfilePicChanged, setIsProfilePicChanged] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(profile?.user.profile_pic || "");
  const [draftImageSrc, setDraftImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [error, setError] = useState("");

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageEditClick = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const onSelectFile = (e: ChangeEvent<HTMLInputElement>) => {
    console.log("hi2");

    const file = e.target.files?.[0];
    console.log(file);
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const imageUrl = reader.result?.toString() || "";
      console.log({ imageUrl });
      // setImageSrc(imageUrl);
      setDraftImageSrc(imageUrl);
      setModalOpen(true);
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!draftImageSrc || !croppedAreaPixels) return;

    const croppedImage = await getCroppedCircularImage(
      draftImageSrc,
      croppedAreaPixels,
    );

    setImageSrc(croppedImage); // preview
    setIsProfilePicChanged(true);
    closeModal();
  };

  const closeModal = () => {
    setModalOpen(false);
    setDraftImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log({ name, value });
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    setIsLoading(true);
    e.preventDefault();
    setError("");

    if (!isOauthUser) {
      if (formData.password && !formData.newPassword) {
        setError("Please enter the new password.");
        setIsLoading(false);
        return;
      }
      if (formData.newPassword && !formData.password) {
        setError("Please enter you current password to set a new one.");
        setIsLoading(false);
        return;
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        setError("New passwords do not match.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const body = new FormData();

      if (formData.name.trim() && formData.name !== profile?.user.name) {
        body.append("name", formData.name);
      }

      // Email + password: only for non-OAuth users
      if (!isOauthUser) {
        if (formData.email.trim() && formData.email !== profile?.user.email) {
          body.append("email", formData.email);
        }
        if (formData.password) {
          body.append("password", formData.password);
        }
        if (formData.newPassword) {
          body.append("new_password", formData.newPassword);
        }
      }
      // profile pic

      if (isProfilePicChanged) {
        // convert base64 data url -> blob -> file
        const res = await fetch(imageSrc);
        const blob = await res.blob();
        const file = new File([blob], "avatar.png", { type: blob.type });
        body.append("profile_pic", file);
      }

      const data = await fetchWithAuth<EditResponse>("/profile", {
        method: "PATCH",
        body,
      });

      if (data.status === "email_verification_required") {
        navigate({ to: "/profile/verify-email" });
        return;
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
    navigate({ to: "/profile" });
  };

  const isFormDirty =
    (formData.name.trim() !== "" && formData.name !== profile?.user.name) ||
    (formData.email.trim() !== "" && formData.email !== profile?.user.email) ||
    formData.password !== "" ||
    formData.newPassword !== "" ||
    formData.confirmNewPassword !== "" ||
    isProfilePicChanged;

  return (
    <>
      <div className="bg-background text-text flex min-h-screen w-full flex-col items-center">
        <NavBar />

        <div className="mx-4 flex w-full max-w-4xl flex-col items-center justify-center px-4 py-10 md:mx-auto">
          <div className="flex justify-center p-4">
            <div className="relative inline-block">
              <img
                src={imageSrc}
                alt="avatar"
                className="ring-secondary size-[clamp(5rem,15vw,8rem)] rounded-full object-cover ring-2"
              />
              <button
                className="bg-accent absolute -right-1 -bottom-1 cursor-pointer items-center justify-center rounded-full p-1 shadow-md"
                onClick={handleImageEditClick}
              >
                <PenIcon />
              </button>
              <input
                type="file"
                id="avatar"
                name="avatar"
                ref={imageInputRef}
                style={{ display: "none" }}
                onChange={onSelectFile}
              ></input>
            </div>
          </div>

          {/*  */}
          <div className="flex p-3">
            <form className="w-full max-w-lg space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  placeholder={profile?.user.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  placeholder={profile?.user.email}
                  onChange={handleChange}
                  disabled={isOauthUser}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800"
                />
              </div>

              {!isOauthUser && (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="newPassword"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirmNewPassword"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      value={formData.confirmNewPassword}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {/* action buttons*/}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-center-safe gap-3">
                <button
                  className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => navigate({ to: "/profile" })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-500"
                  disabled={!isFormDirty || isLoading}
                >
                  {isLoading && (
                    <svg
                      className="h-4 w-4 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  {isLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/*  */}
      {/* modal backdrop */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          {/* modal box */}
          <div className="relative flex w-[90vw] max-w-lg flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            {/* header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Crop Image
              </h2>
              <button
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            {/* cropper area */}
            <div className="relative h-80 w-full overflow-hidden rounded-lg bg-gray-100">
              <EasyCropper
                image={draftImageSrc ?? ""}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* zoom slider */}
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-purple-600"
            />

            {/* actions */}
            <div className="flex justify-end gap-3">
              <button
                className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
                onClick={handleCropConfirm}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
