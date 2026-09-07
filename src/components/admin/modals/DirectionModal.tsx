import { useEffect, useRef, useState } from "react";
import {
  Check,
  ImagePlus,
  Info,
  Loader2,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type {
  ActivityType,
  SubscriptionType,
  Teacher,
} from "../pages/DirectionsPage";

interface DirectionModalProps {
  direction: ActivityType | null;
  teachers: Teacher[];
  subscriptionTypes: SubscriptionType[];
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}

const STORAGE_BUCKET = "activity-images";

export default function DirectionModal({
  direction,
  teachers,
  subscriptionTypes,
  onClose,
  onSaved,
  onError,
}: DirectionModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(direction?.name ?? "");
  const [description, setDescription] = useState(
    direction?.description ?? ""
  );
  const [teacherId, setTeacherId] = useState(direction?.teacher_id ?? "");
  const [subscriptionTypeId, setSubscriptionTypeId] = useState(
    direction?.subscription_type_id ?? ""
  );
  const [duration, setDuration] = useState(
    direction?.duration_minutes ?? 60
  );
  const [maxPlaces, setMaxPlaces] = useState(direction?.max_places ?? 8);
  const [isActive, setIsActive] = useState(
    direction?.is_active ?? true
  );

  const [imageUrl, setImageUrl] = useState(direction?.image ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(direction?.image ?? "");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isEditing = Boolean(direction);

  const selectedSubscription = subscriptionTypes.find(
    (subscription) => subscription.id === subscriptionTypeId
  );

  const isIndividual = Boolean(selectedSubscription?.is_individual);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(imageUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile, imageUrl]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, saving]);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      onError("Можно загрузить только изображение");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError("Размер изображения не должен превышать 5 МБ");
      return;
    }

    setSelectedFile(file);
  };

  const uploadImage = async () => {
    if (!selectedFile) {
      return imageUrl || null;
    }

    setUploading(true);

    try {
      const extension =
        selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `${crypto.randomUUID()}.${extension}`;
      const filePath = `directions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedFile.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImageUrl("");
    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validate = () => {
    if (!name.trim()) {
      onError("Введите название направления");
      return false;
    }

    if (!teacherId) {
      onError("Выберите преподавателя");
      return false;
    }

    if (!subscriptionTypeId) {
      onError("Выберите тип подписки");
      return false;
    }

    if (duration <= 0) {
      onError("Длительность должна быть больше 0 минут");
      return false;
    }

    if (maxPlaces <= 0) {
      onError("Количество мест должно быть больше 0");
      return false;
    }

    if (isIndividual && maxPlaces !== 1) {
      onError(
        "Для индивидуального направления количество мест должно быть равно 1"
      );
      return false;
    }

    return true;
  };

  const syncIndividualActivity = async (
    activityTypeId: string
  ) => {
    if (!selectedSubscription) {
      return;
    }

    if (!selectedSubscription.is_individual) {
      return;
    }

    const pricePerLesson = Number(
      selectedSubscription.base_price_per_lesson
    );

    const teacherPayoutPerLesson = Number(
      selectedSubscription.teacher_payout_per_lesson
    );

    if (!Number.isFinite(pricePerLesson)) {
      throw new Error(
        "У выбранной индивидуальной подписки некорректная цена занятия."
      );
    }

    if (!Number.isFinite(teacherPayoutPerLesson)) {
      throw new Error(
        "У выбранной индивидуальной подписки некорректная выплата педагогу."
      );
    }

    const { data: existingIndividualActivity, error: findError } =
      await supabase
        .from("individual_activities")
        .select("id")
        .eq("activity_type_id", activityTypeId)
        .maybeSingle();

    if (findError) {
      throw findError;
    }

    const payload = {
      activity_type_id: activityTypeId,
      teacher_id: teacherId,
      price_per_lesson: pricePerLesson,
      teacher_payout_per_lesson: teacherPayoutPerLesson,
      duration_minutes: duration,
      is_active: isActive,
    };

    if (existingIndividualActivity) {
      const { error } = await supabase
        .from("individual_activities")
        .update(payload)
        .eq("id", existingIndividualActivity.id);

      if (error) {
        throw error;
      }

      return;
    }

    const { error } = await supabase
      .from("individual_activities")
      .insert(payload);

    if (error) {
      throw error;
    }
  };

  const deactivateIndividualActivity = async (
    activityTypeId: string
  ) => {
    const { error } = await supabase
      .from("individual_activities")
      .update({
        is_active: false,
      })
      .eq("activity_type_id", activityTypeId);

    if (error) {
      throw error;
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);
    onError("");

    try {
      const finalImageUrl = await uploadImage();

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        teacher_id: teacherId,
        subscription_type_id: subscriptionTypeId,
        duration_minutes: duration,
        max_places: isIndividual ? 1 : maxPlaces,
        image: finalImageUrl,
        is_active: isActive,
      };

      let activityTypeId = direction?.id ?? "";

      if (direction) {
        const { error } = await supabase
          .from("activity_types")
          .update(payload)
          .eq("id", direction.id);

        if (error) {
          throw error;
        }

        activityTypeId = direction.id;
      } else {
        const { data, error } = await supabase
          .from("activity_types")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        if (!data?.id) {
          throw new Error(
            "Направление создано, но его ID не был получен."
          );
        }

        activityTypeId = data.id;
      }

      if (isIndividual) {
        await syncIndividualActivity(activityTypeId);
      } else {
        await deactivateIndividualActivity(activityTypeId);
      }

      onSaved();
    } catch (error) {
      console.error("DirectionModal save error:", error);

      onError(
        error instanceof Error
          ? error.message
          : "Не удалось сохранить направление"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditing
                  ? "Редактировать направление"
                  : "Новое направление"}
              </h2>

              {isIndividual && (
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-600">
                  Индивидуальное
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? "Изменение параметров существующего направления"
                : "Добавь направление и укажи, по какой подписке оно доступно"}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-6">
              <section>
                <SectionTitle
                  title="Основная информация"
                  description="Название и описание направления"
                />

                <div className="space-y-4">
                  <Input
                    label="Название направления *"
                    value={name}
                    onChange={setName}
                    placeholder="Например: Пластилинография"
                  />

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-slate-500">
                      Описание
                    </span>

                    <textarea
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      placeholder="Кратко опиши, чем занимаются на занятиях"
                      rows={4}
                      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10"
                    />
                  </label>
                </div>
              </section>

              <section>
                <SectionTitle
                  title="Доступ и преподаватель"
                  description="Укажи преподавателя и минимальную подписку для посещения"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="Преподаватель *"
                    value={teacherId}
                    onChange={setTeacherId}
                  >
                    <option value="">Выберите преподавателя</option>

                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name}
                        {teacher.last_name
                          ? ` ${teacher.last_name}`
                          : ""}
                      </option>
                    ))}
                  </SelectField>

                  <SelectField
                    label="Тип подписки *"
                    value={subscriptionTypeId}
                    onChange={setSubscriptionTypeId}
                  >
                    <option value="">Выберите подписку</option>

                    {subscriptionTypes
                      .filter((subscription) => subscription.is_active)
                      .map((subscription) => (
                        <option
                          key={subscription.id}
                          value={subscription.id}
                        >
                          {subscription.name}
                        </option>
                      ))}
                  </SelectField>
                </div>

                {selectedSubscription && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-[#646cff]/10 bg-[#646cff]/5">
                    <div className="flex items-start gap-3 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#646cff] shadow-sm">
                        <Info className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {selectedSubscription.name}
                          </p>

                          {selectedSubscription.is_individual && (
                            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                              Только индивидуальные
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {selectedSubscription.is_individual
                            ? "Будет автоматически создано индивидуальное занятие, которое появится в разделе «Инд.» расписания."
                            : "Подписка предоставляет доступ к направлениям этого и более низкого уровня."}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 border-t border-[#646cff]/10 bg-white/60 sm:grid-cols-4">
                      <SubscriptionInfo
                        label="Цена занятия"
                        value={formatPrice(
                          selectedSubscription.base_price_per_lesson
                        )}
                      />

                      <SubscriptionInfo
                        label="Педагогу"
                        value={formatPrice(
                          selectedSubscription.teacher_payout_per_lesson
                        )}
                      />

                      <SubscriptionInfo
                        label="Занятий"
                        value={`${selectedSubscription.min_lessons}–${selectedSubscription.max_lessons}`}
                      />

                      <SubscriptionInfo
                        label="Тип"
                        value={
                          selectedSubscription.is_individual
                            ? "Индивидуальная"
                            : "Групповая"
                        }
                      />
                    </div>
                  </div>
                )}
              </section>

              <section>
                <SectionTitle
                  title="Параметры занятия"
                  description="Настройки самого направления"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberInput
                    label="Длительность, минут *"
                    value={duration}
                    onChange={setDuration}
                    min={1}
                    placeholder="60"
                  />

                  <NumberInput
                    label="Максимум мест *"
                    value={isIndividual ? 1 : maxPlaces}
                    onChange={setMaxPlaces}
                    min={1}
                    placeholder="8"
                    disabled={isIndividual}
                  />
                </div>

                {isIndividual && (
                  <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2.5">
                    <p className="text-xs leading-5 text-violet-700">
                      Индивидуальное занятие рассчитано на одного ребёнка.
                      Максимум мест автоматически установлен в 1.
                    </p>
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Направление активно
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Если выключить, направление не будет доступно для
                      новых записей.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsActive((value) => !value)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${isActive ? "bg-[#646cff]" : "bg-slate-300"}`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${isActive ? "left-6" : "left-1"}`}
                    />
                  </button>
                </div>
              </section>
            </div>

            <section>
              <SectionTitle
                title="Фото"
                description="Изображение направления"
              />

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {previewUrl ? (
                  <div className="relative aspect-square">
                    <img
                      src={previewUrl}
                      alt={name || "Фото направления"}
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/50 to-transparent p-3 pt-12">
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-red-500 shadow-sm transition hover:bg-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square w-full flex-col items-center justify-center p-6 text-center transition hover:bg-slate-100"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#646cff]/10 text-[#646cff]">
                      <ImagePlus className="h-7 w-7" />
                    </div>

                    <p className="text-sm font-semibold text-slate-800">
                      Добавить фото
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      JPG, PNG или WEBP
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Максимальный размер — 5 МБ
                    </p>
                  </button>
                )}
              </div>

              {previewUrl && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:border-[#646cff]/30 hover:text-[#646cff]"
                >
                  <Upload className="h-4 w-4" />
                  Заменить фото
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="text-xs leading-5 text-slate-500">
                  Фото загружается в Supabase Storage. В таблице
                  <span className="mx-1 font-medium text-slate-700">
                    activity_types
                  </span>
                  сохраняется только ссылка на изображение.
                </p>
              </div>
            </section>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            disabled={saving}
            className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Отмена
          </button>

          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#646cff] px-6 text-sm font-semibold text-white transition hover:bg-[#5558e8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving || uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploading ? "Загружаем фото..." : "Сохраняем..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing
                  ? "Сохранить изменения"
                  : "Создать направление"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10"
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">
        {label}
      </span>

      <input
        type="number"
        min={min}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => {
          const value = Number(event.target.value);
          onChange(Number.isNaN(value) ? min : value);
        }}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#646cff]/40 focus:ring-4 focus:ring-[#646cff]/10"
      >
        {children}
      </select>
    </label>
  );
}

function SubscriptionInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-r border-slate-100 px-4 py-3 last:border-r-0">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function formatPrice(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(Number(value))} ₽`;
}