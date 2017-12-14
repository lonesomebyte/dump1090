#ifndef DATABASE_H_
#define DATABASE_H_

#include "dump1090.h"
#include <mysql/mysql.h>

void Database_Init(void);

int Database_InitNewDatabase(void);

int Database_CheckAlarms(struct aircraft* aircraft);

my_ulonglong Database_Log(struct aircraft* aircraft);
void Database_LogPath(struct aircraft* aircraft);

#endif //DATABASE_H_
