cmake_minimum_required(VERSION 2.8)

# Name of the project (will be the name of the plugin)
project(addon)

# Build a shared library named after the project from the files in `/`
file(GLOB SOURCE_FILES "native/*.cpp" "native/*.h" "native/include/*.h")
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})

# Gives our library file a .node extension without any "lib" prefix
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

# Essential include files to build a node addon,
# You should add this line in every CMake.js based project
target_include_directories(${PROJECT_NAME} PRIVATE ${CMAKE_JS_INC})

# Essential library files to link to a node addon
# You should add this line in every CMake.js based project
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})

# link libmpv libraries
link_directories("${CMAKE_SOURCE_DIR}/native")
target_link_libraries(${PROJECT_NAME} "${CMAKE_SOURCE_DIR}/native/mpv.lib")

# link for win32 API
target_link_libraries(${PROJECT_NAME} "Shlwapi.lib")

# Include N-API wrappers
execute_process(COMMAND node -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}/native
        OUTPUT_VARIABLE NODE_ADDON_API_DIR
        )
string(REPLACE "\n" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
target_include_directories(${PROJECT_NAME} PRIVATE ${NODE_ADDON_API_DIR})