#define _GNU_SOURCE
#include "database.h"
#include <stdio.h>
#include <string.h>

#define DB_MYSQL_SERVER "localhost"
#define DB_MYSQL_USER "dump1090"
#define DB_MYSQL_PASSWORD "highinthesky"
#define DB_MYSQL_DBNAME "dump1090"

struct alarm {
    char* alarmType;
    char* alarmValue;
    struct alarm* next;
};    

static struct alarm* alarms = NULL;

static MYSQL* Database_Open(void) {
     MYSQL *con = mysql_init(NULL);

    if (con == NULL) 
    {
      fprintf(stderr, "%s\n", mysql_error(con));
      exit(1);
    }

    if (mysql_real_connect(con, DB_MYSQL_SERVER, DB_MYSQL_USER, DB_MYSQL_PASSWORD, 
          DB_MYSQL_DBNAME, 0, NULL, 0) == NULL) 
    {
      fprintf(stderr, "%s\n", mysql_error(con));
      mysql_close(con);
      exit(1);
    }  

    return con;
}

static void Database_Close(MYSQL* con) {
    mysql_close(con);
}

static MYSQL_RES* Database_Query(MYSQL* con, char* query) {
    if (mysql_query(con, query)) 
    {
      return NULL;
    }
    
    MYSQL_RES *result = mysql_store_result(con);
    return result;
}
static void Database_ReadAlarms(void) {
    MYSQL* con = Database_Open();
    MYSQL_RES* result = Database_Query(con, "SELECT alarmType, alarmValue FROM alarms");
    if (result) {
        MYSQL_ROW row;
        while ((row = mysql_fetch_row(result))) { 
            struct alarm* newAlarm = malloc(sizeof(struct alarm));
            newAlarm->next = alarms;
            alarms = newAlarm;
            newAlarm->alarmType = malloc(strlen(row[0])+1);
            strcpy(newAlarm->alarmType, row[0]);
            newAlarm->alarmValue = malloc(strlen(row[1])+1);
            strcpy(newAlarm->alarmValue, row[1]);
        } 
        mysql_free_result(result);
    }   
    Database_Close(con);
}
int Database_CheckAlarms(struct aircraft* aircraft) {
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

my_ulonglong Database_Log(struct aircraft* aircraft) {
    my_ulonglong retval = 0;
    char buf[256]; 
    MYSQL* con = Database_Open();
    MYSQL_RES* res;

    // Check if this plane was already registered the last x minutes.
    // Then we append this data to the existing log

    snprintf(buf, sizeof(buf), "SELECT logId FROM logs WHERE modeS=%d AND date >= now() - INTERVAL 10 MINUTE;",aircraft->addr);
    res = Database_Query(con, buf);
    if (res!=NULL && mysql_num_rows(res)>0) {
        MYSQL_ROW row = mysql_fetch_row(res);
        retval=atoi(row[0]);
    }
    else {
        snprintf(buf, sizeof(buf), "INSERT INTO logs (modeS,registration) VALUES (%d,'%s')", aircraft->addr, aircraft->registration);

        if (mysql_query(con, buf)) {
            printf("Error inserting log into database\n");
        }
        else {
            retval = mysql_insert_id(con);        
        }
    }
    Database_Close(con);
    return retval;
}

#ifdef LOGGING
void Database_LogPath(struct aircraft* aircraft) {
    char buf[256]; 
    MYSQL* con = Database_Open();

    struct pathVector* p = aircraft->path;
    while (p) {
        struct tm t = *localtime(&p->time);
        snprintf(buf, sizeof(buf), "INSERT INTO logPathVectors (logId,lat,lon,altitude,speed,date) VALUES (%d,%f,%f,%d,%d,'%04d-%02d-%02d %02d:%02d:%02d')", aircraft->logId, p->lat, p->lon, p->altitude, p->speed,t.tm_year+1900,t.tm_mon+1,t.tm_mday,t.tm_hour,t.tm_min,t.tm_sec);
        if (mysql_query(con, buf)) {
            printf("Error inserting logPathVector into database\n");
            break;
        }
        p = p->next;
    }
    Database_Close(con);
}
#endif

void Database_Init(void) {
    Database_ReadAlarms();
}

int Database_InitNewDatabase(void) {
    // const char* initStr="CREATE TABLE alarms ( alarmId INT NOT NULL AUTO_INCREMENT, alarmType ENUM('icao','registration','higher','lower','squawk'), alarmValue VARCHAR(32), PRIMARY KEY (alarmId) );"
    //    "CREATE TABLE logs (logId INT NOT NULL AUTO_INCREMENT PRIMARY KEY, modeS INT, registration VARCHAR(6), date TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
    //    CREATE TABLE logPathVectors (logPathVectorId INT NOT NULL AUTO_INCREMENT PRIMARY KEY, logId INT, lat FLOAT, lon FLOAT, altitude INT, speed INT,date TIMESTAMP);
    //    "CREATE USER 'dump1090'@'localhost' IDENTIFIED BY 'highinthesky';"
    //    " GRANT ALL PRIVILEGES ON dump1090.* TO 'dump1090'@'localhost';";
    return 0;
}
