Dump1090 README
===


This fork of Malcolm Robb's Dump 1090 is optimized for use by (contrail-) spotters.
Compared to Malcolm Robb's version this has following additional
features:

 - New web interface
 - Plane type and registration from basestation.sqb (if provided)
 - Route retrieved from Flightroute-iata.sqb (if provided)
 - Customizable alarms upon plane detection based on
     - Registration
     - Type
     - Squawk
     - Altitude
 - Optional logging of planes and routes in mysql database
 - Statistics of planes in range:
     - Highest and lowest plane
     - Farthest and closest plane
     - Fastest and slowest plane
     - Plane type statistics
     - Airline statistics
     - Airport statistics

Installation
---


Prerequisites:

 - Install libsqlite-dev
 - Install mysql
 - Install libmysql-dev
 - Create the dump1090 database

    mysql -u root -p < database.mysql

Type "make".

Normal usage
---

All options from Malcom Robb's version are available but you probably want to
run it with following options:

    ./dump1090 --interactive --net



Credits
---

Dump1090 was written by Salvatore Sanfilippo <antirez@gmail.com> and is
released under the BSD three clause license.

Malcom Robb extended the original version with new features. This
version was the starting point of this fork.
