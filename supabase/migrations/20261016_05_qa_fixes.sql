-- QA pass (16 Oct 2026)
-- * The public snapshot no longer carries photoFile (the biometric photo field).
--   No public page uses it; the Privacy Policy says that photo stays private.
--   The showcase photo, which scholars choose to show, is unchanged.
-- * Index for the session foreign key (Supabase performance advisor).

create or replace function be_private.public_applicant(a public.applicants) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', a.id, 'email', '', 'name', a.name, 'status', a.status, 'created_at', a.created_at,
    'data', jsonb_strip_nulls(jsonb_build_object(
      'scholarStatus', a.data->'scholarStatus',
      'cohort',        a.data->'cohort',
      'scholarId',     a.data->'scholarId',
      'acceptedAt',    a.data->'acceptedAt',
      'deleted',       a.data->'deleted',
      'profile', jsonb_build_object(
        'personal', jsonb_strip_nulls(jsonb_build_object(
          'fullName',      a.data->'profile'->'personal'->'fullName',
          'country',       a.data->'profile'->'personal'->'country',
          'showcasePhoto', case when coalesce(a.data->'profile'->'personal'->'showcasePhoto'->>'path', '') not like 'docs/%'
                                then be_private.pub_file(a.data->'profile'->'personal'->'showcasePhoto') end)),
        'university', jsonb_strip_nulls(jsonb_build_object(
          'name',            a.data->'profile'->'university'->'name',
          'program',         a.data->'profile'->'university'->'program',
          'degreeLevel',     a.data->'profile'->'university'->'degreeLevel',
          'currentSemester', a.data->'profile'->'university'->'currentSemester'))),
      'semesters', coalesce((
        select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                 'id', s->'id', 'label', s->'label', 'number', s->'number', 'status', s->'status',
                 'paidAt', s->'paidAt',
                 'bill', case when jsonb_typeof(s->'bill') = 'object'
                              then jsonb_build_object('amount', s->'bill'->'amount') end)))
          from jsonb_array_elements(case when jsonb_typeof(a.data->'semesters') = 'array'
                                         then a.data->'semesters' else '[]'::jsonb end) s), '[]'::jsonb)
    )));
$$;

create index if not exists applicant_sessions_applicant on be_private.applicant_sessions (applicant_id);
