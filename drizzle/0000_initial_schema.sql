CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');
CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id varchar(255) NOT NULL,
  name varchar(200) NOT NULL,
  email varchar(320) NOT NULL,
  role user_role NOT NULL DEFAULT 'PATIENT',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_clerk_user_id_uq ON users (clerk_user_id);
CREATE UNIQUE INDEX users_email_uq ON users (lower(email));
CREATE INDEX users_role_idx ON users (role);

CREATE TABLE specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  slug varchar(140) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX specialties_name_uq ON specialties (lower(name));
CREATE UNIQUE INDEX specialties_slug_uq ON specialties (slug);

CREATE TABLE doctor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  specialty_id uuid NOT NULL REFERENCES specialties(id) ON DELETE RESTRICT,
  display_name varchar(200) NOT NULL,
  biography text,
  qualifications text,
  consultation_fee_minor integer NOT NULL DEFAULT 0,
  appointment_duration_minutes integer NOT NULL DEFAULT 30,
  buffer_minutes integer NOT NULL DEFAULT 0,
  timezone varchar(64) NOT NULL DEFAULT 'UTC',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT doctor_profiles_fee_nonnegative_ck CHECK (consultation_fee_minor >= 0),
  CONSTRAINT doctor_profiles_duration_positive_ck CHECK (appointment_duration_minutes > 0),
  CONSTRAINT doctor_profiles_buffer_nonnegative_ck CHECK (buffer_minutes >= 0)
);
CREATE UNIQUE INDEX doctor_profiles_user_id_uq ON doctor_profiles (user_id);
CREATE INDEX doctor_profiles_active_specialty_idx ON doctor_profiles (is_active, specialty_id);

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(id) ON DELETE RESTRICT,
  scheduled_start_at timestamptz NOT NULL,
  scheduled_end_at timestamptz NOT NULL,
  status appointment_status NOT NULL DEFAULT 'PENDING',
  reason_for_visit varchar(500),
  patient_notes text,
  cancellation_reason varchar(500),
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_positive_interval_ck CHECK (scheduled_end_at > scheduled_start_at),
  CONSTRAINT appointments_no_doctor_overlap EXCLUDE USING gist (
    doctor_id WITH =,
    tstzrange(scheduled_start_at, scheduled_end_at, '[)') WITH &&
  ) WHERE (status IN ('PENDING', 'CONFIRMED'))
);
CREATE INDEX appointments_patient_start_idx ON appointments (patient_id, scheduled_start_at);
CREATE INDEX appointments_doctor_start_idx ON appointments (doctor_id, scheduled_start_at);
CREATE INDEX appointments_status_start_idx ON appointments (status, scheduled_start_at);

CREATE TABLE doctor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT doctor_availability_day_ck CHECK (day_of_week BETWEEN 1 AND 7),
  CONSTRAINT doctor_availability_time_ck CHECK (end_time > start_time)
);
CREATE INDEX doctor_availability_doctor_day_idx ON doctor_availability (doctor_id, day_of_week);

CREATE TABLE doctor_time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  reason varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT doctor_time_off_interval_ck CHECK (end_at > start_at)
);
CREATE INDEX doctor_time_off_doctor_interval_idx ON doctor_time_off (doctor_id, start_at, end_at);
