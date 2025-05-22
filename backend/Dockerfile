# Imagen base con Java 21
FROM eclipse-temurin:21-jdk

# Establece un volumen temporal para mejorar el rendimiento
VOLUME /tmp

# Variable que permite definir el nombre del JAR
ARG JAR_FILE=target/*.jar

# Copia el archivo JAR generado por Maven al contenedor
COPY ${JAR_FILE} app.jar

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "/app.jar"]
