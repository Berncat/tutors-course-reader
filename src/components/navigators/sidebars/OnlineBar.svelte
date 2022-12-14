<script lang="ts">
  import { currentCourse, currentUser, revealOnline, studentsOnline } from "../../../stores";
  import { getContext } from "svelte";
  import type { Course } from "../../../tutors-reader-lib/src/models/course";
  import type { StudentMetric, User } from "../../../tutors-reader-lib/src/types/metrics-types";
  import type { MetricsService } from "../../../reader-lib/services/metrics-service";
  import { PresenceService } from "../../../reader-lib/services/presence-service";
  import SidebarComponent from "./SidebarComponent.svelte";
  import StudentCard from "../../cards/StudentCard.svelte";
  import { isAuthenticated } from "../../../tutors-reader-lib/src/utils/auth-utils";

  const metricsService: MetricsService = getContext("metrics");
  let students: StudentMetric[] = [];
  let presenceService: PresenceService = null;
  let lastCourse: Course = null;
  let user: User;

  function refresh(refreshedStudents: StudentMetric[]) {
    let student = refreshedStudents.find((student) => student.nickname === user.nickname);
    let index = refreshedStudents.indexOf(student);
    if (index !== -1) {
      refreshedStudents.splice(index, 1);
    }
    students = [...refreshedStudents];
    studentsOnline.set(refreshedStudents.length);
  }

  async function initService(course: Course) {
    if (presenceService) presenceService.stop();
    metricsService.setCourse(course);
    presenceService = new PresenceService(metricsService, students, refresh, null);
    presenceService.setCourse(course);
    await presenceService.start();
    students = [];
    studentsOnline.set(0);
  }

  currentCourse.subscribe((newCourse: Course) => {
    if (newCourse && newCourse != lastCourse) {
      lastCourse = newCourse;
      if (isAuthenticated() && newCourse?.authLevel > 0) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        initService(newCourse);
      }
    }
  });

  currentUser.subscribe((newUser) => {
    user = newUser;
  });
</script>

{#if $revealOnline}
  <SidebarComponent title="Online Students" show={revealOnline} origin="right-0">
    <div class="flex flex-wrap">
      {#if $studentsOnline == 0}
        <span class="text-lg">No students currently online...</span>
      {/if}
      {#each students as student}
        <StudentCard {student} />
      {/each}
    </div>
  </SidebarComponent>
{/if}
