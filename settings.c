#define _GNU_SOURCE
#include "settings.h"
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

struct settingsHandle {
    char* content;
    long filesize;
    long pos;
};

struct alarm {
    char* alarmType;
    char* alarmValue;
    struct alarm* next;
};    

struct alarm* alarms = NULL;

static struct settingsHandle* openSettings( char* filename) {
    FILE* file = fopen(filename, "r");
    struct settingsHandle* handle;
    if (file==NULL) {
        return NULL;
    }
    handle = malloc(sizeof(struct settingsHandle)); 
    handle->pos = 0;
    fseek(file, 0L, SEEK_END);
    handle->filesize = ftell(file);
    fseek(file, 0L, SEEK_SET);
    handle->content = malloc(handle->filesize+1);
    if (fread(handle->content, handle->filesize, 1, file)!=1) {
        return NULL;
    }
    fclose(file);
    handle->content[handle->filesize]='\n';
    return handle;
}

static char* readLine(struct settingsHandle* handle) {
    char* start;
    while (handle->pos<handle->filesize && 
        (handle->content[handle->pos]=='\r' || handle->content[handle->pos]=='\n' || handle->content[handle->pos]=='\0')) {
        handle->pos++;
    }
    start = handle->content+handle->pos; 

    if (handle->pos==handle->filesize) {
        return NULL;
    }

    while (handle->pos<handle->filesize && (handle->content[handle->pos]!='\r' && handle->content[handle->pos]!='\n')) {
        handle->pos++;
    }

    if (handle->pos==handle->filesize) {
        return NULL;
    }
    handle->content[handle->pos]='\0';

    return start;    
}

static void closeSettings(struct settingsHandle* handle) {
    free(handle->content);
    free(handle);
}

static void loadAlarms(void) {
    char* line;
    struct settingsHandle* handle = openSettings("alarms.txt");
    if (handle==NULL) {
        return;
    }
    
    line = readLine(handle);
    while (line!=NULL) {
        char* p=line;
        //Skip all spaces
        while (*p!='\0' && (*p==' ' || *p=='\t')) {
            p++;
        }
        if (*p!='#') {
            //Search the end of the first word
            while (*p!='\0' && *p!=' ' && *p!='\t') {
                p++;
            }
            if (*p!='\0') {
                *p='\0';
                p++;
                while (*p==' ' || *p=='\t') {
                    p++;
                }
                struct alarm* newAlarm = malloc(sizeof(struct alarm));
                newAlarm->next = alarms;
                alarms = newAlarm;
                newAlarm->alarmType = malloc(strlen(line)+1);
                strcpy(newAlarm->alarmType, line);
                newAlarm->alarmValue = malloc(strlen(p)+1);
                strcpy(newAlarm->alarmValue, p);
                printf("Alarm: %s - %s\n", newAlarm->alarmType, newAlarm->alarmValue);
            } 
        }
        line = readLine(handle);
    }
    closeSettings(handle);
}
 
void settingsInit() {
    loadAlarms();
}

int settingsCheckAlarms(struct aircraft* aircraft) {
    struct alarm* alarm = alarms;
    while (alarm) {    
        char *ptr;
        long alarmValueInt = strtol(alarm->alarmValue, &ptr, 10);
        char validValue = ptr!=alarm->alarmValue;
        if (strcmp(alarm->alarmType,"icao")==0 &&
            strcasestr(aircraft->icaoType, alarm->alarmValue)!=NULL) {
                return 1;
        } else if (strcmp(alarm->alarmType,"registration")==0 &&
            strcasestr(aircraft->registration, alarm->alarmValue)!=NULL) {
                return 1;
        } else if (strcmp(alarm->alarmType,"lower")==0 &&
            (aircraft->altitude>0 && validValue && aircraft->altitude<=alarmValueInt)) {
                return 1;
        } else if (strcmp(alarm->alarmType,"higher")==0 &&
            (aircraft->altitude>0 && validValue && aircraft->altitude>=alarmValueInt)) {
                return 1;
        } else if (strcmp(alarm->alarmType,"squawk")==0 && 
            (validValue && aircraft->modeA==alarmValueInt)) {
                return 1;
        }
        alarm = alarm->next;
    } 
    return 0;
}

