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

interface ActivityData {
  id: string;
  name: string;
}

interface BookingData {
  id: string;
  child_id: string;
  status: string;
  lesson_date: string;
  created_at: string;
  schedule_id: string;
  type: "group" | "individual";
  activity: ActivityData | null;
}

interface SubscriptionData {
  id: string;
  lessonsTotal: number;
  lessonsLeft: number;
  pricePerLesson: number;
  endDate: string;
  isActive: boolean;
  name: string;
  isIndividual: boolean;
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

const formatLessonDate = (lessonDate: string) => {
  if (!lessonDate) {
    return "Дата не указана";
  }

  const date = new Date(`${lessonDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return lessonDate;
  }

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatPhone = (phone: string | null | undefined) => {
  if (!phone) {
    return "Телефон не указан";
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("7")) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }

  if (digits.length === 11 && digits.startsWith("8")) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }

  return phone;
};

const getTodayString = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getMonthStartString = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
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

  const [subscription, setSubscription] =
    useState<SubscriptionData | null>(null);

  const [bonusPoints, setBonusPoints] = useState(0);

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
        /*
         * ---------------------------------------------------------
         * 1. Загружаем актуальные данные пользователя
         * ---------------------------------------------------------
         */

        const { data: currentUser, error: userError } = await supabase
          .from("users")
          .select("id, phone, first_name, last_name, bonus_points")
          .eq("id", user.id)
          .single();

        if (userError) {
          throw userError;
        }

        if (currentUser) {
          setProfileData({
            firstName: currentUser.first_name ?? "",
            lastName: currentUser.last_name ?? "",
          });

          setBonusPoints(currentUser.bonus_points ?? 0);
        }

        /*
         * ---------------------------------------------------------
         * 2. Загружаем детей
         * ---------------------------------------------------------
         */

        const { data: children, error: childrenError } = await supabase
          .from("children")
          .select("id, first_name, last_name, birth_date, gender")
          .eq("parent_id", user.id)
          .order("created_at", { ascending: true });

        if (childrenError) {
          throw childrenError;
        }

        const mappedChildren: ChildData[] = (children ?? []).map(
          (child) => ({
            id: child.id,
            firstName: child.first_name,
            lastName: child.last_name,
            birthDate: child.birth_date,
            gender: child.gender,
          })
        );

        setChildrenData(mappedChildren);

        const childIds = mappedChildren.map((child) => child.id);

        /*
         * ---------------------------------------------------------
         * 3. Загружаем активный абонемент
         * ---------------------------------------------------------
         */

        const { data: subscriptionData, error: subscriptionError } =
          await supabase
            .from("user_subscriptions")
            .select(`
              id,
              lessons_total,
              lessons_left,
              price_per_lesson,
              end_date,
              is_active,
              subscription_types (
                id,
                name,
                is_individual
              )
            `)
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("end_date", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (subscriptionError) {
          throw subscriptionError;
        }

        if (subscriptionData) {
          const subscriptionType = Array.isArray(
            subscriptionData.subscription_types
          )
            ? subscriptionData.subscription_types[0] ?? null
            : subscriptionData.subscription_types ?? null;

          setSubscription({
            id: subscriptionData.id,
            lessonsTotal: subscriptionData.lessons_total,
            lessonsLeft: subscriptionData.lessons_left,
            pricePerLesson: Number(
              subscriptionData.price_per_lesson ?? 0
            ),
            endDate: subscriptionData.end_date,
            isActive: subscriptionData.is_active,
            name: subscriptionType?.name ?? "Абонемент",
            isIndividual: Boolean(
              subscriptionType?.is_individual
            ),
          });
        } else {
          setSubscription(null);
        }

        /*
         * ---------------------------------------------------------
         * Если детей нет — статистика и записи пустые
         * ---------------------------------------------------------
         */

        if (childIds.length === 0) {
          setStats({
            totalBookings: 0,
            monthBookings: 0,
            directionsCount: 0,
          });

          setChildBookings({});
          return;
        }

        /*
         * ---------------------------------------------------------
         * 4. Групповые записи
         *
         * ВАЖНО:
         * lesson_date находится в group_bookings,
         * а НЕ в group_schedules.
         * ---------------------------------------------------------
         */

        const { data: groupBookings, error: groupBookingsError } =
          await supabase
            .from("group_bookings")
            .select(`
              id,
              schedule_id,
              child_id,
              status,
              lesson_date,
              created_at,
              group_schedules (
                id,
                activity_type_id,
                activity_types (
                  id,
                  name
                )
              )
            `)
            .in("child_id", childIds)
            .eq("user_id", user.id)
            .order("lesson_date", { ascending: false });

        if (groupBookingsError) {
          throw groupBookingsError;
        }

        /*
         * ---------------------------------------------------------
         * 5. Индивидуальные записи
         *
         * lesson_date находится непосредственно
         * в individual_bookings.
         * ---------------------------------------------------------
         */

        const {
          data: individualBookings,
          error: individualBookingsError,
        } = await supabase
          .from("individual_bookings")
          .select(`
            id,
            schedule_id,
            child_id,
            status,
            lesson_date,
            created_at,
            individual_schedules (
              id,
              individual_activity_id,
              individual_activities (
                id,
                activity_type_id,
                activity_types (
                  id,
                  name
                )
              )
            )
          `)
          .in("child_id", childIds)
          .eq("user_id", user.id)
          .order("lesson_date", { ascending: false });

        if (individualBookingsError) {
          throw individualBookingsError;
        }

        /*
         * ---------------------------------------------------------
         * 6. Приводим групповые записи к единому виду
         * ---------------------------------------------------------
         */

        const mappedGroupBookings: BookingData[] = (
          groupBookings ?? []
        ).map((booking: any) => {
          const schedule = Array.isArray(
            booking.group_schedules
          )
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
            lesson_date: booking.lesson_date,
            created_at: booking.created_at,
            type: "group",
            activity: activity
              ? {
                  id: activity.id,
                  name: activity.name,
                }
              : null,
          };
        });

        /*
         * ---------------------------------------------------------
         * 7. Приводим индивидуальные записи к единому виду
         * ---------------------------------------------------------
         */

        const mappedIndividualBookings: BookingData[] = (
          individualBookings ?? []
        ).map((booking: any) => {
          const schedule = Array.isArray(
            booking.individual_schedules
          )
            ? booking.individual_schedules[0] ?? null
            : booking.individual_schedules ?? null;

          const individualActivity = schedule
            ? Array.isArray(
                schedule.individual_activities
              )
              ? schedule.individual_activities[0] ?? null
              : schedule.individual_activities ?? null
            : null;

          const activity = individualActivity
            ? Array.isArray(
                individualActivity.activity_types
              )
              ? individualActivity.activity_types[0] ?? null
              : individualActivity.activity_types ?? null
            : null;

          return {
            id: booking.id,
            schedule_id: booking.schedule_id,
            child_id: booking.child_id,
            status: booking.status,
            lesson_date: booking.lesson_date,
            created_at: booking.created_at,
            type: "individual",
            activity: activity
              ? {
                  id: activity.id,
                  name: activity.name,
                }
              : null,
          };
        });

        /*
         * ---------------------------------------------------------
         * 8. Объединяем все записи
         * ---------------------------------------------------------
         */

        const mappedBookings: BookingData[] = [
          ...mappedGroupBookings,
          ...mappedIndividualBookings,
        ].sort((a, b) => {
          return (
            new Date(
              `${b.lesson_date}T00:00:00`
            ).getTime() -
            new Date(
              `${a.lesson_date}T00:00:00`
            ).getTime()
          );
        });

        /*
         * ---------------------------------------------------------
         * 9. Разбиваем записи по детям
         * ---------------------------------------------------------
         */

        const bookingsByChild: Record<
          string,
          BookingData[]
        > = {};

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

        /*
         * ---------------------------------------------------------
         * 10. Статистика
         * ---------------------------------------------------------
         */

        const monthStart = getMonthStartString();

        const monthBookings = mappedBookings.filter(
          (booking) => {
            return (
              booking.lesson_date &&
              booking.lesson_date >= monthStart
            );
          }
        );

        const directionIds = new Set(
          mappedBookings
            .map(
              (booking) =>
                booking.activity?.id
            )
            .filter(Boolean)
        );

        setStats({
          totalBookings: mappedBookings.length,
          monthBookings: monthBookings.length,
          directionsCount: directionIds.size,
        });
      } catch (loadError: any) {
        console.error(
          "Ошибка загрузки профиля:",
          loadError
        );

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

  /*
   * -----------------------------------------------------------
   * Статус абонемента
   * -----------------------------------------------------------
   */

  const subscriptionIsActuallyActive = useMemo(() => {
    if (!subscription) {
      return false;
    }

    const today = getTodayString();

    return (
      subscription.isActive &&
      subscription.endDate >= today
    );
  }, [subscription]);

  /*
   * -----------------------------------------------------------
   * Сохранение профиля
   * -----------------------------------------------------------
   */

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
      const { data: updatedUser, error: updateError } =
        await supabase
          .from("users")
          .update({
            first_name: profileData.firstName.trim(),
            last_name:
              profileData.lastName.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
          .select(
            "id, first_name, last_name, phone, bonus_points"
          )
          .single();

      if (updateError) {
        throw updateError;
      }

      if (updatedUser) {
        setProfileData({
          firstName: updatedUser.first_name ?? "",
          lastName: updatedUser.last_name ?? "",
        });

        setBonusPoints(
          updatedUser.bonus_points ?? 0
        );
      }

      await refreshUser();

      setEditProfile(false);
      setSuccessMessage(
        "Данные профиля успешно обновлены"
      );

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (saveError: any) {
      console.error(
        "Ошибка сохранения профиля:",
        saveError
      );

      setError(
        saveError?.message ||
          "Не удалось сохранить данные профиля"
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  /*
   * -----------------------------------------------------------
   * Редактирование ребёнка
   * -----------------------------------------------------------
   */

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
    if (!editChildId || !user?.id) {
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
      const {
        data: updatedChild,
        error: updateError,
      } = await supabase
        .from("children")
        .update({
          first_name:
            editChildData.firstName.trim(),
          last_name:
            editChildData.lastName.trim() || null,
          birth_date: editChildData.birthDate,
        })
        .eq("id", editChildId)
        .eq("parent_id", user.id)
        .select(
          "id, first_name, last_name, birth_date, gender"
        )
        .single();

      if (updateError) {
        throw updateError;
      }

      setChildrenData((currentChildren) =>
        currentChildren.map((child) =>
          child.id === editChildId
            ? {
                id: updatedChild.id,
                firstName:
                  updatedChild.first_name,
                lastName:
                  updatedChild.last_name,
                birthDate:
                  updatedChild.birth_date,
                gender:
                  updatedChild.gender,
              }
            : child
        )
      );

      await refreshUser();

      setEditChildId(null);
      setSuccessMessage(
        "Данные ребёнка обновлены"
      );

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (saveError: any) {
      console.error(
        "Ошибка сохранения ребёнка:",
        saveError
      );

      setError(
        saveError?.message ||
          "Не удалось сохранить данные ребёнка"
      );
    } finally {
      setIsSavingChild(false);
    }
  };

  /*
   * -----------------------------------------------------------
   * Добавление ребёнка
   * -----------------------------------------------------------
   */

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
      const {
        data: createdChild,
        error: insertError,
      } = await supabase
        .from("children")
        .insert({
          parent_id: user.id,
          first_name:
            newChild.firstName.trim(),
          last_name:
            newChild.lastName.trim() || null,
          birth_date: newChild.birthDate,
        })
        .select(
          "id, first_name, last_name, birth_date, gender"
        )
        .single();

      if (insertError) {
        throw insertError;
      }

      const mappedChild: ChildData = {
        id: createdChild.id,
        firstName:
          createdChild.first_name,
        lastName:
          createdChild.last_name,
        birthDate:
          createdChild.birth_date,
        gender:
          createdChild.gender,
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

      setSuccessMessage(
        "Ребёнок успешно добавлен"
      );

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (addError: any) {
      console.error(
        "Ошибка добавления ребёнка:",
        addError
      );

      setError(
        addError?.message ||
          "Не удалось добавить ребёнка"
      );
    } finally {
      setIsAddingChild(false);
    }
  };

  /*
   * -----------------------------------------------------------
   * Удаление ребёнка
   * -----------------------------------------------------------
   */

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

    const childBookings =
      Object.values(
        childBookingsState
      ).flat();

    void childBookings;

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
      /*
       * Проверяем групповые записи
       */

      const {
        count: groupBookingCount,
        error: groupCheckError,
      } = await supabase
        .from("group_bookings")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("child_id", childId)
        .eq("user_id", user.id);

      if (groupCheckError) {
        throw groupCheckError;
      }

      /*
       * Проверяем индивидуальные записи
       */

      const {
        count: individualBookingCount,
        error: individualCheckError,
      } = await supabase
        .from("individual_bookings")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("child_id", childId)
        .eq("user_id", user.id);

      if (individualCheckError) {
        throw individualCheckError;
      }

      const totalChildBookings =
        (groupBookingCount ?? 0) +
        (individualBookingCount ?? 0);

      if (totalChildBookings > 0) {
        setError(
          "Нельзя удалить ребёнка, у которого есть записи на занятия. Сначала отмените его записи."
        );
        return;
      }

      const { error: deleteError } =
        await supabase
          .from("children")
          .delete()
          .eq("id", childId)
          .eq("parent_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setChildrenData((currentChildren) =>
        currentChildren.filter(
          (item) => item.id !== childId
        )
      );

      setChildBookings((current) => {
        const updated = {
          ...current,
        };

        delete updated[childId];

        return updated;
      });

      setExpandedChild(null);

      await refreshUser();

      setSuccessMessage(
        "Ребёнок удалён из профиля"
      );

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (deleteError: any) {
      console.error(
        "Ошибка удаления ребёнка:",
        deleteError
      );

      if (deleteError?.code === "23503") {
        setError(
          "Нельзя удалить ребёнка, у которого есть связанные записи."
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

  /*
   * Небольшой alias для текущих записей.
   * Нужен только чтобы не ломать обработчик удаления.
   */

  const childBookingsState = childBookings;

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
            {Array.from({ length: 6 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-3xl bg-secondary"
                />
              )
            )}
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

              setProfileData({
                firstName:
                  user.firstName ?? "",
                lastName:
                  user.lastName ?? "",
              });

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
          {/* LEFT */}

          <div className="space-y-5">
            <div className="glass-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-secondary">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>

              <h2 className="text-xl font-bold text-primary-opacity">
                {[profileData.firstName, profileData.lastName]
                  .filter(Boolean)
                  .join(" ") || "Пользователь"}
              </h2>

              <div className="mt-4 space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm text-secondary-opacity">
                  <User className="h-4 w-4 shrink-0 text-primary" />

                  <span>
                    {profileData.firstName ||
                      "Имя не указано"}
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

            {/* Activity */}

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

          {/* CENTER */}

          <div className="space-y-5">
            <PremiumWidget
              compact
              onSubscribeClick={() =>
                onNavigate("subscribe")
              }
            />

            <p className="text-center text-xs leading-5 text-secondary-opacity">
              Подписку необходимо будет оплатить
              заранее. Сделать это можно, написав в
              поддержку или лично по адресу Ясная 14к2.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-4 text-center">
                <CreditCard className="mx-auto mb-2 h-6 w-6 text-primary" />

                <p className="text-2xl font-bold text-primary-opacity">
                  {subscription
                    ? subscription.lessonsLeft
                    : 0}
                </p>

                <p className="text-xs text-secondary-opacity">
                  Занятий осталось
                </p>
              </div>

              <div className="glass-card p-4 text-center">
                <Award className="mx-auto mb-2 h-6 w-6 text-primary" />

                <p className="text-2xl font-bold text-primary-opacity">
                  {bonusPoints}
                </p>

                <p className="text-xs text-secondary-opacity">
                  Баллов
                </p>
              </div>
            </div>

            {/* Subscription */}

            <div className="glass-card p-5">
              <h3 className="mb-3 font-bold text-primary">
                Ваш абонемент
              </h3>

              {subscription ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-opacity">
                      Абонемент
                    </span>

                    <span className="font-semibold text-primary-opacity">
                      {subscription.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-opacity">
                      Статус
                    </span>

                    <span
                      className={
                        subscriptionIsActuallyActive
                          ? "font-semibold text-emerald-500"
                          : "font-semibold text-red-500"
                      }
                    >
                      {subscriptionIsActuallyActive
                        ? "Активен"
                        : "Истёк"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-opacity">
                      Осталось
                    </span>

                    <span className="font-semibold text-primary-opacity">
                      {subscription.lessonsLeft} из{" "}
                      {subscription.lessonsTotal}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-opacity">
                      Действует до
                    </span>

                    <span className="font-semibold text-primary-opacity">
                      {formatBirthDate(
                        subscription.endDate
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm leading-6 text-secondary-opacity">
                    У вас нет активного абонемента.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate("subscribe")
                    }
                    className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Выбрать абонемент
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}

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
                    Добавьте ребёнка, чтобы
                    записывать его на занятия.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {childrenData.map((child) => {
                    const childAge =
                      calculateAge(
                        child.birthDate
                      );

                    const bookings =
                      childBookings[child.id] ??
                      [];

                    const childDirections = [
                      ...new Set(
                        bookings
                          .map(
                            (booking) =>
                              booking.activity?.name
                          )
                          .filter(Boolean)
                      ),
                    ];

                    const isExpanded =
                      expandedChild ===
                      child.id;

                    return (
                      <div key={child.id}>
                        <div className="glass-card flex items-center justify-between px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                              <User className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <span className="block truncate font-semibold text-primary-opacity">
                                {[
                                  child.firstName,
                                  child.lastName,
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              </span>

                              <p className="text-xs text-secondary-opacity">
                                {childAge !==
                                null
                                  ? `${childAge} ${
                                      childAge ===
                                      1
                                        ? "год"
                                        : childAge >=
                                            2 &&
                                          childAge <=
                                            4
                                        ? "года"
                                        : "лет"
                                    }`
                                  : formatBirthDate(
                                      child.birthDate
                                    )}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditChild(
                                  child
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-primary-foreground"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedChild(
                                  isExpanded
                                    ? null
                                    : child.id
                                )
                              }
                              className="text-muted-foreground"
                            >
                              <ChevronDown
                                className={`h-5 w-5 transition-transform ${
                                  isExpanded
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="glass-card mt-1 space-y-4 px-4 py-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-secondary-opacity">
                                Дата рождения
                              </span>

                              <span className="font-semibold text-primary-opacity">
                                {formatBirthDate(
                                  child.birthDate
                                )}
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

                              {childDirections.length >
                              0 ? (
                                <p className="mt-1 font-semibold leading-5 text-primary-opacity">
                                  {childDirections.join(
                                    ", "
                                  )}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-secondary-opacity">
                                  Пока нет записей
                                </p>
                              )}
                            </div>

                            {bookings.length >
                              0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-opacity">
                                  История занятий
                                </p>

                                {bookings
                                  .slice(0, 5)
                                  .map(
                                    (
                                      booking
                                    ) => (
                                      <div
                                        key={
                                          booking.id
                                        }
                                        className="rounded-xl bg-secondary/60 p-3"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-primary-opacity">
                                              {booking
                                                .activity
                                                ?.name ??
                                                "Занятие"}
                                            </p>

                                            <p className="mt-1 text-xs text-secondary-opacity">
                                              {formatLessonDate(
                                                booking.lesson_date
                                              )}
                                              {" · "}
                                              {booking.type ===
                                              "individual"
                                                ? "Индивидуальное"
                                                : "Групповое"}
                                            </p>
                                          </div>

                                          <span className="shrink-0 text-[10px] font-semibold uppercase text-secondary-opacity">
                                            {booking.status}
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  )}
                              </div>
                            )}

                            <button
                              type="button"
                              disabled={
                                deletingChildId ===
                                child.id
                              }
                              onClick={() =>
                                removeChild(
                                  child.id
                                )
                              }
                              className="flex items-center gap-1 text-xs text-destructive transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingChildId ===
                              child.id ? (
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

            {/* Directions */}

            <div className="glass-card p-5">
              <h3 className="mb-3 font-bold text-primary-opacity">
                Направления детей
              </h3>

              {stats.directionsCount > 0 ? (
                <div className="space-y-2">
                  {[
                    ...new Map(
                      Object.values(
                        childBookings
                      )
                        .flat()
                        .filter(
                          (booking) =>
                            booking.activity
                        )
                        .map(
                          (booking) => [
                            booking.activity!
                              .id,
                            booking.activity!
                              .name,
                          ]
                        )
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
                  Пока нет записей на
                  направления.
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
              !isSavingProfile &&
              setEditProfile(false)
            }
          />

          <div className="relative w-full max-w-md animate-scale-in rounded-2xl bg-background p-6 shadow-elevated">
            <button
              type="button"
              disabled={isSavingProfile}
              onClick={() =>
                setEditProfile(false)
              }
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
                  value={
                    profileData.firstName
                  }
                  onChange={(event) =>
                    setProfileData(
                      (current) => ({
                        ...current,
                        firstName:
                          event.target.value,
                      })
                    )
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
                  value={
                    profileData.lastName
                  }
                  onChange={(event) =>
                    setProfileData(
                      (current) => ({
                        ...current,
                        lastName:
                          event.target.value,
                      })
                    )
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
                    {formatPhone(
                      user.phone
                    )}
                  </span>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Номер телефона используется
                  для входа и не изменяется
                  здесь.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSavingProfile}
              onClick={
                handleSaveProfile
              }
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
              !isSavingChild &&
              setEditChildId(null)
            }
          />

          <div className="relative w-full max-w-md animate-scale-in rounded-2xl bg-background p-6 shadow-elevated">
            <button
              type="button"
              disabled={isSavingChild}
              onClick={() =>
                setEditChildId(null)
              }
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
                  value={
                    editChildData.firstName
                  }
                  onChange={(event) =>
                    setEditChildData(
                      (current) => ({
                        ...current,
                        firstName:
                          event.target.value,
                      })
                    )
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
                  value={
                    editChildData.lastName
                  }
                  onChange={(event) =>
                    setEditChildData(
                      (current) => ({
                        ...current,
                        lastName:
                          event.target.value,
                      })
                    )
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
                  value={
                    editChildData.birthDate
                  }
                  onChange={(event) =>
                    setEditChildData(
                      (current) => ({
                        ...current,
                        birthDate:
                          event.target.value,
                      })
                    )
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isSavingChild}
              onClick={
                handleSaveChild
              }
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
              !isAddingChild &&
              setShowAddChild(false)
            }
          />

          <div className="relative w-full max-w-md animate-scale-in rounded-2xl bg-background p-6 shadow-elevated">
            <button
              type="button"
              disabled={isAddingChild}
              onClick={() =>
                setShowAddChild(false)
              }
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
                  value={
                    newChild.firstName
                  }
                  onChange={(event) =>
                    setNewChild(
                      (current) => ({
                        ...current,
                        firstName:
                          event.target.value,
                      })
                    )
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
                  value={
                    newChild.lastName
                  }
                  onChange={(event) =>
                    setNewChild(
                      (current) => ({
                        ...current,
                        lastName:
                          event.target.value,
                      })
                    )
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
                  value={
                    newChild.birthDate
                  }
                  onChange={(event) =>
                    setNewChild(
                      (current) => ({
                        ...current,
                        birthDate:
                          event.target.value,
                      })
                    )
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isAddingChild}
              onClick={
                handleAddChild
              }
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