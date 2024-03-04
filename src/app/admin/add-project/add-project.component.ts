import { Component } from '@angular/core';
import { Project } from '../../models/Project';
import { UserService } from '../../Services/user.service';
import { User } from '../../models/User';
import { Task } from '../../models/Task';
import { Router } from '@angular/router';
import { ProjectService } from '../../Services/project.service';
import { vars } from '../../env';
import { TaskService } from '../../Services/task.service';
@Component({
  selector: 'app-add-project',
  templateUrl: './add-project.component.html',
  styleUrl: './add-project.component.css',
})
export class AddProjectComponent {
  //constructor
  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private taskService: TaskService,
    private router: Router
  ) {}
  //attributes
  project: Project = {
    name: '',
    description: '',
    deadLine: new Date(),
    owner: this.userService.getUser(),
    photo: vars.apiUri + '/projectPhoto/default_project.png',
    participants: [
      this.userService.getUser(),
      // { name: 'yaser' }, { name: 'munir' }
    ],
  };
  searchParticipantsKey: string = '';
  resultingParticipants: User[] = [
    // { name: 'yaser' }, { name: 'munir' }
  ];
  task: Task = {
    name: '',
    description: '',
    order: 0,
    deadLine: new Date(),
    participants: [
      // { name: 'yaser' }, { name: 'munir' }
    ],
    photo: vars.apiUri + '/taskPhoto/default_task.png',
  };
  tasks: Task[] = [];
  tasksPhotos: any[] = [];
  taskResponse: {
    error: boolean;
    message: string;
  } = {
    error: false,
    message: '',
  };
  projectResponse: {
    error: boolean;
    message: string;
  } = {
    error: false,
    message: '',
  };
  projectPhoto: any;
  isCreating: boolean = false;
  //methods

  getParticipants() {
    return this.project.participants;
  }
  createProject() {
    //disable the create button
    this.isCreating = true;
    //check exeptions
    if (this.project.name == '') {
      this.projectResponse = {
        error: true,
        message: 'Project name is required !',
      };
      const alertProject = document.getElementById('alertProject');
      alertProject?.scrollIntoView();
      return;
    }
    this.projectService
      .createProject(this.project)
      .subscribe((project: any) => {
        //upload project photo
        if (this.projectPhoto != undefined) {
          this.projectService
            .uploadProjectPhoto(this.projectPhoto, project.id!)
            .subscribe((p: any) => {});
        }

        //add tasks
        for (let i = 0; i < this.tasks.length; i++) {
          const task = this.tasks[i];
          task.projectId = project.id;
          this.taskService.createTask(task).subscribe((t: Task) => {
            //upload task photo if exist
            console.log(this.tasks);
            console.log(this.tasksPhotos);

            if (this.tasksPhotos[i] != undefined) {
              this.taskService
                .uploadTaskPhoto(this.tasksPhotos[i], t.id!)
                .subscribe((t2: Task) => {});
            }
          });
        }
        //redirect to dashbord
        setTimeout(() => {
          this.router.navigate(['/admin/dashbord']);
        }, 1000 * this.tasksPhotos.length);
      });
  }
  searchParticipant() {
    //empty key case
    if (this.searchParticipantsKey == '') {
      this.resultingParticipants = [];
      return;
    }
    this.userService
      .searchUserByName(this.searchParticipantsKey)
      .subscribe((users: any) => {
        this.resultingParticipants = users;
      });
  }
  addParticipantToProject(participant: User) {
    //reset the search key and result to empty
    this.searchParticipantsKey = '';
    this.resultingParticipants = [];
    //check if already selected
    for (let participantIterator of this.project.participants!) {
      if (participant.id == participantIterator.id) {
        return;
      }
    }
    //add the participant to the participants array
    this.project.participants!.push(participant);
  }
  addTask() {
    //check required fields

    if (this.task.name == '') {
      this.taskResponse = {
        error: true,
        message: 'Project name is required !',
      };
      return;
    }

    // const task = {
    //   name: this.task.name,
    //   description: this.task.description,
    //   deadLine: this.task.deadLine,
    //   participants: this.task.participants,
    //   order: this.task.order,
    // };

    this.tasks.push(this.task);
    //reset task
    this.task = {
      name: '',
      description: '',
      order: 0,
      deadLine: new Date(),
      participants: [
        // { name: 'yaser' }, { name: 'munir' }
      ],
      photo: vars.apiUri + '/taskPhoto/default_task.png',
    };
    //reset default img
    const photo = document.getElementById(
      'taskPhotoPreview'
    ) as HTMLImageElement;
    photo.src = vars.apiUri + '/taskPhoto/default_task.png';
  }
  addParticipantToTask(participant: User) {
    //check if already selected
    if (this.task.participants?.includes(participant)) {
      return;
    }
    this.task.participants?.push(participant);
  }
  popProjectParticipant(participant: User) {
    this.project.participants = this.project.participants?.filter((p) => {
      return p != participant;
    });
    //pop it from current task
    this.popTaskParticipant(participant);
    //pop it from all tasks
    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.tasks[i];
      task.participants = task.participants?.filter((p) => {
        return p != participant;
      });
    }
  }
  popTaskParticipant(participant: User) {
    this.task.participants = this.task.participants?.filter((p) => {
      return p != participant;
    });
  }
  isInculdedInTaskParticipants(participant: User): boolean {
    return this.task.participants!.includes(participant);
  }
  //return to dashbord method
  return() {
    this.router.navigate(['/admin/dashbord']);
  }
  popTask(task: Task) {
    this.tasks = this.tasks.filter((t) => {
      return t != task;
    });
  }
  //task photo
  clickTaskPhoto() {
    document.getElementById('taskPhotoInput')?.click();
  }
  TaskPhotoChange(e: any) {
    const imagePreview = document.getElementById(
      'taskPhotoPreview'
    ) as HTMLImageElement;
    const file = e.target!.files[0];
    //set the global file variable
    let currentTasksIndex = this.tasks.length;
    this.tasksPhotos[currentTasksIndex] = file;

    // Create a FileReader object to read the file
    const reader = new FileReader();

    // Set up the FileReader to display the image when loaded
    reader.onload = function (e) {
      // Update the src attribute of the image tag with the data URL of the selected image
      let str: string = e.target?.result as string;
      imagePreview!.src = str;
    };

    // Read the selected file as a data URL (base64 encoded string)
    reader.readAsDataURL(file);
  }
  //project photo
  clickProjectPhoto() {
    document.getElementById('projectPhotoInput')?.click();
  }
  projectPhotoChange(e: any) {
    const imagePreview = document.getElementById(
      'projectPhotoPreview'
    ) as HTMLImageElement;
    const file = e.target!.files[0];
    //set the global file variable
    this.projectPhoto = file;

    // Create a FileReader object to read the file
    const reader = new FileReader();

    // Set up the FileReader to display the image when loaded
    reader.onload = function (e) {
      // Update the src attribute of the image tag with the data URL of the selected image
      let str: string = e.target?.result as string;
      imagePreview!.src = str;
    };
    // Read the selected file as a data URL (base64 encoded string)
    reader.readAsDataURL(file);
  }
  getToday() {
    // Get the current date
    const today = new Date();
    // Format the date as YYYY-MM-DD
    const formattedDate = today.toISOString().split('T')[0];
    console.log(formattedDate);

    return '2024-03-04';
  }
}
