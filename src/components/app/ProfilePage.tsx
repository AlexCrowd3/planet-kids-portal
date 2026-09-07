import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PremiumWidget from "@/components/shared/PremiumWidget";
import {
  ArrowLeft,
  Edit,
  User,
  ChevronDown,
  Trash2,
  UserPlus,
  Phone,
  CreditCard,
  Award,
  X,
  Check,
  Save,
  CalendarDays,
  TrendingUp,
  BookOpen,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ProfilePageProps {
  onNavigate: (view: string) => void;
}

interface ChildData {
  id: string;
  firstName: string;
  lastName: string | null;
  birthDate: string;
  gender: string | null;
}

interface BookingData {
  id: string;
  schedule_id: string;
  child_id: string;
  status: string;
  created_at: string;
  schedule: {
    id: string;
    lesson_date: string;
    activity_type_id: string;
    activity: {
      id: string;
      name: string;
    } | null;
  } | null;
}

interface ProfileStats {
  totalBookings: number;
  monthBookings: number;
  directionsCount: number;
}

const inputClass =
  "w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/50";

const calculateAge = (birthDate: string) => {
  if (!birthDate) {
    return null;
  }

  const birth = new Date(`${birthDate}T00:00:00`);

  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return Math.max(0, age);
};

const formatBirthDate = (birthDate: string) => {
  if (!birthDate) {
    return "Дата рождения не указана";
  }

  const date = new Date(`${birthDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return birthDate;
  }

  return date.toLocaleDateString("ru-RU");
};

const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("7")) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }

  if (digits.length === 11 && digits.startsWith("8")) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }

  return phone;
};

const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  const { user, logout, refreshUser } = useAuth();

  const [editProfile, setEditProfile] = useState(false);
  const [editChildId, setEditChildId] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  });

  const [childrenData, setChildrenData] = useState<ChildData[]>([]);

  const [newChild, setNewChild] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
  });

  const [editChildData, setEditChildData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
  });

  const [showAddChild, setShowAddChild] = useState(false);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);

  const [stats, setStats] = useState<ProfileStats>({
    totalBookings: 0,
    monthBookings: 0,
    directionsCount: 0,
  });

  const [childBookings, setChildBookings] = useState<
    Record<string, BookingData[]>
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setProfileData({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
    });
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadProfileData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: children, error: childrenError } = await supabase
          .from("children")
          .select("id, first_name, last_name, birth_date, gender")
          .eq("parent_id", user.id)
          .order("created_at", { ascending: true });

        if (childrenError) {
          throw childrenError;
        }

        const mappedChildren: ChildData[] = (children ?? []).map((child) => ({
          id: child.id,
          firstName: child.first_name,
          lastName: child.last_name,
          birthDate: child.birth_date,
          gender: child.gender,
        }));

        setChildrenData(mappedChildren);

        const childIds = mappedChildren.map((child) => child.id);

        if (childIds.length === 0) {
          setStats({
            totalBookings: 0,
            monthBookings: 0,
            directionsCount: 0,
          });

          setChildBookings({});
          return;
        }

        const { data: bookings, error: bookingsError } = await supabase
          .from("group_bookings")
          .select(`
            id,
            schedule_id,
            child_id,
            status,
            created_at,
            group_schedules (
              id,
              lesson_date,
              activity_type_id,
              activity_types (
                id,
                name
              )
            )
          `)
          .in("child_id", childIds)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (bookingsError) {
          throw bookingsError;
        }

        const mappedBookings: BookingData[] = (bookings ?? []).map(
          (booking: any) => {
            const schedule = Array.isArray(booking.group_schedules)
              ? booking.group_schedules[0] ?? null
              : booking.group_schedules ?? null;

            const activity = schedule
              ? Array.isArray(schedule.activity_types)
                ? schedule.activity_types[0] ?? null
                : schedule.activity_types ?? null
              : null;

            return {
              id: booking.id,
              schedule_id: booking.schedule_id,
              child_id: booking.child_id,
              status: booking.status,
              created_at: booking.created_at,
              schedule: schedule
                ? {
                    id: schedule.id,
                    lesson_date: schedule.lesson_date,
                    activity_type_id: schedule.activity_type_id,
                    activity: activity
                      ? {
                          id: activity.id,
                          name: activity.name,
                        }
                      : null,
                  }
                : null,
            };
          }
        );

        const bookingsByChild: Record<string, BookingData[]> = {};

        mappedChildren.forEach((child) => {
          bookingsByChild[child.id] = [];
        });

        mappedBookings.forEach((booking) => {
          if (!bookingsByChild[booking.child_id]) {
            bookingsByChild[booking.child_id] = [];
          }

          bookingsByChild[booking.child_id].push(booking);
        });

        setChildBookings(bookingsByChild);

        const currentDate = new Date();

        const monthStart = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );

        const monthStartString = monthStart
          .toISOString()
          .split("T")[0];

        const monthBookings = mappedBookings.filter((booking) => {
          return (
            booking.schedule?.lesson_date &&
            booking.schedule.lesson_date >= monthStartString
          );
        });

        const directionIds = new Set(
          mappedBookings
            .map((booking) => booking.schedule?.activity_type_id)
            .filter(Boolean)
        );

        setStats({
          totalBookings: mappedBookings.length,
          monthBookings: monthBookings.length,
          directionsCount: directionIds.size,
        });
      } catch (loadError: any) {
        console.error("Ошибка загрузки профиля:", loadError);

        setError(
          loadError?.message ||
            "Не удалось загрузить данные профиля"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user?.id]);

  const activeSubscription = useMemo(() => {
    return user?.subscriptionActive
      ? {
          active: true,
          endDate: user.subscriptionDate,
        }
      : {
          active: false,
          endDate: null,
        };
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user?.id) {
      return;
    }

    if (!profileData.firstName.trim()) {
      setError("Введите имя");
      return;
    }

    setIsSavingProfile(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          first_name: profileData.firstName.trim(),
          last_name: profileData.lastName.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      await refreshUser();

      setEditProfile(false);
      setSuccessMessage("Данные профиля успешно обновлены");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (saveError: any) {
      console.error("Ошибка сохранения профиля:", saveError);

      setError(
        saveError?.message ||
          "Не удалось сохранить данные профиля"
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openEditChild = (child: ChildData) => {
    setEditChildId(child.id);

    setEditChildData({
      firstName: child.firstName,
      lastName: child.lastName ?? "",
      birthDate: child.birthDate,
    });

    setError(null);
    setSuccessMessage(null);
  };

  const handleSaveChild = async () => {
    if (!editChildId) {
      return;
    }

    if (!editChildData.firstName.trim()) {
      setError("Введите имя ребёнка");
      return;
    }

    if (!editChildData.birthDate) {
      setError("Укажите дату рождения ребёнка");
      return;
    }

    setIsSavingChild(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data: updatedChild, error: updateError } = await supabase
        .from("children")
        .update({
          first_name: editChildData.firstName.trim(),
          last_name: editChildData.lastName.trim() || null,
          birth_date: editChildData.birthDate,
        })
        .eq("id", editChildId)
        .eq("parent_id", user?.id)
        .select("id, first_name, last_name, birth_date, gender")
        .single();

      if (updateError) {
        throw updateError;
      }

      setChildrenData((currentChildren) =>
        currentChildren.map((child) =>
          child.id === editChildId
            ? {
                id: updatedChild.id,
                firstName: updatedChild.first_name,
                lastName: updatedChild.last_name,
                birthDate: updatedChild.birth_date,
                gender: updatedChild.gender,
              }
            : child
        )
      );

      await refreshUser();

      setEditChildId(null);
      setSuccessMessage("Данные ребёнка обновлены");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (saveError: any) {
      console.error("Ошибка сохранения ребёнка:", saveError);

      setError(
        saveError?.message ||
          "Не удалось сохранить данные ребёнка"
      );
    } finally {
      setIsSavingChild(false);
    }
  };

  const handleAddChild = async () => {
    if (!user?.id) {
      return;
    }

    if (!newChild.firstName.trim()) {
      setError("Введите имя ребёнка");
      return;
    }

    if (!newChild.birthDate) {
      setError("Укажите дату рождения ребёнка");
      return;
    }

    setIsAddingChild(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data: createdChild, error: insertError } = await supabase
        .from("children")
        .insert({
          parent_id: user.id,
          first_name: newChild.firstName.trim(),
          last_name: newChild.lastName.trim() || null,
          birth_date: newChild.birthDate,
        })
        .select("id, first_name, last_name, birth_date, gender")
        .single();

      if (insertError) {
        throw insertError;
      }

      const mappedChild: ChildData = {
        id: createdChild.id,
        firstName: createdChild.first_name,
        lastName: createdChild.last_name,
        birthDate: createdChild.birth_date,
        gender: createdChild.gender,
      };

      setChildrenData((currentChildren) => [
        ...currentChildren,
        mappedChild,
      ]);

      setChildBookings((current) => ({
        ...current,
        [mappedChild.id]: [],
      }));

      setNewChild({
        firstName: "",
        lastName: "",
        birthDate: "",
      });

      setShowAddChild(false);

      await refreshUser();

      setSuccessMessage("Ребёнок успешно добавлен");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (addError: any) {
      console.error("Ошибка добавления ребёнка:", addError);

      setError(
        addError?.message ||
          "Не удалось добавить ребёнка"
      );
    } finally {
      setIsAddingChild(false);
    }
  };

  const removeChild = async (childId: string) => {
    if (!user?.id) {
      return;
    }

    const child = childrenData.find(
      (item) => item.id === childId
    );

    if (!child) {
      return;
    }

    const confirmed = window.confirm(
      `Удалить ребёнка "${child.firstName}" из профиля?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingChildId(childId);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: deleteError } = await supabase
        .from("children")
        .delete()
        .eq("id", childId)
        .eq("parent_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setChildrenData((currentChildren) =>
        currentChildren.filter((item) => item.id !== childId)
      );

      setChildBookings((current) => {
        const updated = { ...current };
        delete updated[childId];
        return updated;
      });

      setExpandedChild(null);

      await refreshUser();

      setSuccessMessage("Ребёнок удалён из профиля");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (deleteError: any) {
      console.error("Ошибка удаления ребёнка:", deleteError);

      if (deleteError?.code === "23503") {
        setError(
          "Нельзя удалить ребёнка, у которого есть записи на занятия. Сначала отмените его записи."
        );
      } else {
        setError(
          deleteError?.message ||
            "Не удалось удалить ребёнка"
        );
      }
    } finally {
      setDeletingChildId(null);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-primary-opacity">
            Вы не авторизованы
          </h2>

          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="mt-4 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
          >
            Вернуться
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
            <div className="h-7 w-32 animate-pulse rounded-xl bg-secondary" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-3xl bg-secondary"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <h1 className="text-2xl font-bold text-primary-opacity">
              Профиль
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setSuccessMessage(null);
              setEditProfile(true);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

            <p className="text-sm font-medium leading-6 text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-4 w-4" />
            </div>

            <p className="text-sm font-semibold text-emerald-700">
              {successMessage}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-5">
            <div className="glass-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-secondary">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>

              <h2 className="text-xl font-bold text-primary-opacity">
                {[user.firstName, user.lastName]
                  .filter(Boolean)
                  .join(" ") || "Пользователь"}
              </h2>

              <div className="mt-4 space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm text-secondary-opacity">
                  <User className="h-4 w-4 shrink-0 text-primary" />

                  <span>
                    {user.firstName || "Имя не указано"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-secondary-opacity">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />

                  <span>
                    {formatPhone(user.phone)}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity stats */}
            <div className="glass-card p-5">
              <h3 className="mb-3 font-bold text-primary-opacity">
                Активность
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-secondary-opacity">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Занятий записано
                  </div>

                  <span className="font-bold text-primary-opacity">
                    {stats.totalBookings}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-secondary-opacity">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    За этот месяц
                  </div>

                  <span className="font-bold text-primary-opacity">
                    {stats.monthBookings}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-secondary-opacity">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Направлений
                  </div>

                  <span className="font-bold text-primary-opacity">
                    {stats.directionsCount}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/90 py-3.5 text-center font-semibold text-destructive-foreground transition-colors hover:bg-destructive active:scale-[0.98]"
            >
              Выйти из аккаунта
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Center column */}
          <div className="space-y-5">
            <PremiumWidget
              compact
              onSubscribeClick={() => onNavigate("subscribe")}
            />

            <p className="text-center text-xs leading-5 text-secondary-opacity">
              Подписку необходимо будет оплатить заранее. Сделать это можно,
              написав в поддержку или лично по адресу Ясная 14к2.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-4 text-center">
                <CreditCard className="mx-auto mb-2 h-6 w-6 text-primary" />

                <p className="text-2xl font-bold text-primary-opacity">
                  {user.subscriptionActive
                    ? user.children.length > 0
                      ? "—"
                      : "—"
                    : "0"}
                </p>

                <p className="text-xs text-secondary-opacity">
                  Занятий осталось
                </p>
              </div>

              <div className="glass-card p-4 text-center">
                <Award className="mx-auto mb-2 h-6 w-6 text-primary" />

                <p className="text-2xl font-bold text-primary-opacity">
                  {user.points}
                </p>

                <p className="text-xs text-secondary-opacity">
                  Баллов
                </p>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="mb-3 font-bold text-primary">
                Ваш абонемент
              </h3>

              {activeSubscription.active ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-opacity">
                      Статус
                    </span>

                    <span className="font-semibold text-emerald-500">
                      Активен
                    </span>
                  </div>

                  {activeSubscription.endDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-opacity">
                        Действует до
                      </span>

                      <span className="font-semibold text-primary-opacity">
                        {new Date(
                          `${activeSubscription.endDate}T00:00:00`
                        ).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm leading-6 text-secondary-opacity">
                    У вас нет активного абонемента.
                  </p>

                  <button
                    type="button"
                    onClick={() => onNavigate("subscribe")}
                    className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Выбрать абонемент
                  </button>
                </div>
              )}
            </div>

            <div className="glass-card p-5">
              <h3 className="mb-3 font-bold text-primary">
                Зачем нужны баллы?
              </h3>

              <div className="space-y-1 text-sm text-secondary-opacity">
                <p>100 баллов — дополнительное занятие</p>
                <p>250 баллов — мастер-класс в подарок</p>
                <p>500 баллов — игрушка на выбор</p>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-primary-opacity">
                  Дети
                </h3>

                <span className="text-xs text-secondary-opacity">
                  {childrenData.length}
                </span>
              </div>

              {childrenData.length === 0 ? (
                <div className="glass-card p-5 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <User className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-primary-opacity">
                    Пока нет детей
                  </p>

                  <p className="mt-1 text-xs leading-5 text-secondary-opacity">
                    Добавьте ребёнка, чтобы записывать его на занятия.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {childrenData.map((child) => {
                    const childAge = calculateAge(child.birthDate);
                    const bookings = childBookings[child.id] ?? [];
                    const childDirections = [
                      ...new Set(
                        bookings
                          .map(
                            (booking) =>
                              booking.schedule?.activity?.name
                          )
                          .filter(Boolean)
                      ),
                    ];

                    const isExpanded =
                      expandedChild === child.id;

                    return (
                      <div key={child.id}>
                        <div className="glass-card flex items-center justify-between px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                              <User className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <span className="block truncate font-semibold text-primary-opacity">
                                {[child.firstName, child.lastName]
                                  .filter(Boolean)
                                  .join(" ")}
                              </span>

                              <p className="text-xs text-secondary-opacity">
                                {childAge !== null
                                  ? `${childAge} ${childAge === 1 ? "год" : childAge >= 2 && childAge <= 4 ? "года" : "лет"}`
                                  : formatBirthDate(child.birthDate)}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditChild(child)
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-primary-foreground"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedChild(
                                  isExpanded ? null : child.id
                                )
                              }
                              className="text-muted-foreground"
                            >
                              <ChevronDown
                                className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="glass-card mt-1 space-y-3 px-4 py-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-secondary-opacity">
                                Дата рождения
                              </span>

                              <span className="font-semibold text-primary-opacity">
                                {formatBirthDate(child.birthDate)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-secondary-opacity">
                                Занятий записано
                              </span>

                              <span className="font-bold text-primary-opacity">
                                {bookings.length}
                              </span>
                            </div>

                            <div className="text-sm">
                              <span className="text-secondary-opacity">
                                Направления
                              </span>

                              {childDirections.length > 0 ? (
                                <p className="mt-1 font-semibold leading-5 text-primary-opacity">
                                  {childDirections.join(", ")}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-secondary-opacity">
                                  Пока нет записей
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={
                                deletingChildId === child.id
                              }
                              onClick={() =>
                                removeChild(child.id)
                              }
                              className="flex items-center gap-1 text-xs text-destructive transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingChildId === child.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}

                              Удалить ребёнка
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccessMessage(null);
                setShowAddChild(true);
              }}
              className="glass-premium flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-center font-semibold"
            >
              <UserPlus className="h-5 w-5" />
              Добавить ребёнка
            </button>

            <div className="glass-card p-5">
              <h3 className="mb-3 font-bold text-primary-opacity">
                Направления детей
              </h3>

              {stats.directionsCount > 0 ? (
                <div className="space-y-2">
                  {[
                    ...new Map(
                      Object.values(childBookings)
                        .flat()
                        .filter(
                          (booking) =>
                            booking.schedule?.activity
                        )
                        .map((booking) => [
                          booking.schedule!.activity!.id,
                          booking.schedule!.activity!.name,
                        ])
                    ).values(),
                  ].map((direction) => (
                    <div
                      key={direction}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-primary-opacity">
                        {direction}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-secondary-opacity">
                  Пока нет записей на направления.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() =>
              !isSavingProfile && setEditProfile(false)
            }
          />

          <div className="relative w-full max-w-md animate-scale-in rounded-2xl bg-background p-6 shadow-elevated">
            <button
              type="button"
              disabled={isSavingProfile}
              onClick={() => setEditProfile(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="mb-5 text-xl font-bold text-primary-opacity">
              Редактировать профиль
            </h2>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-opacity">
                  Имя
                </label>

                <input
                  value={profileData.firstName}
                  onChange={(event) =>
                    setProfileData((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Введите имя"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-opacity">
                  Фамилия
                </label>

                <input
                  value={profileData.lastName}
                  onChange={(event) =>
                    setProfileData((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Введите фамилию"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-opacity">
                  Телефон
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary px-4 py-3">
                  <Phone className="h-4 w-4 text-primary" />

                  <span className="text-sm text-secondary-opacity">
                    {formatPhone(user.phone)}
                  </span>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Номер телефона используется для входа и не изменяется здесь.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSavingProfile}
              onClick={handleSaveProfile}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3.5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Сохраняем...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Edit Child Modal */}
      {editChildId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() =>
              !isSavingChild && setEditChildId(null)
            }
          />

          <div className="relative w-full max-w-md animate-scale-in rounded-2xl bg-background p-6 shadow-elevated">
            <button
              type="button"
              disabled={isSavingChild}
              onClick={() => setEditChildId(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="mb-5 text-xl font-bold text-primary-opacity">
              Данные ребёнка
            </h2>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-opacity">
                  Имя
                </label>

                <input
                  value={editChildData.firstName}
                  onChange={(event) =>
                    setEditChildData((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Имя ребёнка"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-opacity">
                  Фамилия
                </label>

                <input
                  value={editChildData.lastName}
                  onChange={(event) =>
                    setEditChildData((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Фамилия ребёнка"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-opacity">
                  Дата рождения
                </label>

                <input
                  type="date"
                  value={editChildData.birthDate}
                  onChange={(event) =>
                    setEditChildData((current) => ({
                      ...current,
                      birthDate: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isSavingChild}
              onClick={handleSaveChild}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3.5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingChild ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Сохраняем...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Add Child Modal */}
      {showAddChild && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() =>
              !isAddingChild && setShowAddChild(false)
            }
          />

          <div className="relative w-full max-w-md animate-scale-in rounded-2xl bg-background p-6 shadow-elevated">
            <button
              type="button"
              disabled={isAddingChild}
              onClick={() => setShowAddChild(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="mb-5 text-xl font-bold text-primary-opacity">
              Добавить ребёнка
            </h2>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-opacity">
                  Имя
                </label>

                <input
                  value={newChild.firstName}
                  onChange={(event) =>
                    setNewChild((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Введите имя"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-opacity">
                  Фамилия
                </label>

                <input
                  value={newChild.lastName}
                  onChange={(event) =>
                    setNewChild((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Введите фамилию"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-opacity">
                  Дата рождения
                </label>

                <input
                  type="date"
                  value={newChild.birthDate}
                  onChange={(event) =>
                    setNewChild((current) => ({
                      ...current,
                      birthDate: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isAddingChild}
              onClick={handleAddChild}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3.5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAddingChild ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Добавляем...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Добавить
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;