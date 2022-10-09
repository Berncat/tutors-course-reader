import path from "path-browserify";
import { courseUrl, currentCourse, currentLo, currentUser, week } from "../../stores";
import { replace } from "svelte-spa-router";
import { Course } from "../../tutors-reader-lib/src/models/course";
import { Lab } from "../../tutors-reader-lib/src/models/lab";
import { lastSegment } from "../../tutors-reader-lib/src/utils/lo-utils";
import { fromLocalStorage, getUserId, isAuthenticated } from "../../tutors-reader-lib/src/utils/auth-utils";
import { fetchUserById } from "../../tutors-reader-lib/src/utils/metrics-utils";
import type { Lo, WeekType } from "../../tutors-reader-lib/src/types/lo-types";
import type { Topic } from "../../tutors-reader-lib/src/models/topic";
import { readTextFile, BaseDirectory } from '@tauri-apps/api/fs';

export class CourseService {
  course: Course;
  courses = new Map<string, Course>();
  courseUrl = "";

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async getOrLoadCourse(): Promise<Course> {
    try {
      const contents = await readTextFile('tutors.json', { dir: BaseDirectory.App });
      const data = JSON.parse(contents)
      const course = new Course(data, data.id);
      return course;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async checkAuthenticated(course: Course) {
    if (isAuthenticated()) {
      const user = await fetchUserById(course.url, getUserId(), null);
      currentUser.set(user);
    }
  }

  async checkWhiteList(course: Course) {
    if (course.hasWhiteList()) {
      if (isAuthenticated()) {
        const user = fromLocalStorage();
        const student = course.getStudents().find((student) => student.github === user.nickname);
        if (!student) {
          console.log("Not Authorised to access this models");
          replace(`/unauthorised`);
        }
      }
    }
  }

  async readCourse(): Promise<Course> {
    let course = await this.getOrLoadCourse();
    currentCourse.set(course);
    week.set(<WeekType>course?.currentWeek);
    await this.checkAuthenticated(course);
    await this.checkWhiteList(course);
    this.course = course;
    return course;
  }

  async readTopic(topicId: string): Promise<Topic> {
    const courseId = path.dirname(topicId);
    const course = await this.readCourse();
    const topic = course.topicIndex.get(lastSegment(topicId));
    currentLo.set(topic.lo);
    return topic!;
  }

  async readLab(url: string): Promise<Lab> {
    let courseId = url.substring(0, url.indexOf("/"));
    const course = await this.readCourse();
    let labId = `/#/lab/${url}`;
    const lastSegment = url.substr(url.lastIndexOf("/") + 1);
    if (!lastSegment.startsWith("book")) {
      url = url.substr(0, url.lastIndexOf("/"));
      labId = `/#/lab/${url}`;
    }
    const lo = course.loIndex.get(labId);
    let lab = course.hydratedLabs.get(labId);
    if (!lab) {
      lab = new Lab(course, lo!, url);
      course.hydratedLabs.set(labId, lab);
    }
    currentLo.set(lab.lo);
    return lab;
  }

  async readWall(url: string): Promise<Lo[]> {
    const path = url.split("/");
    const course = await this.readCourse();
    const wall = course.walls.get(path[0]);
    return wall!;
  }

  async readLo(url: string, loType: string): Promise<Lo> {
    const courseId = url.substring(0, url.indexOf("/"));
    const course = await this.readCourse();
    const ref = `/#/${loType}/${url}`;
    const lo = course.loIndex.get(ref);
    currentLo.set(lo);
    return lo!;
  }
}
