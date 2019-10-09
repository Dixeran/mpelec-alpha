#include "GenThumbsAsync.h"

GenThumbsAsync::GenThumbsAsync(Napi::Function &func, std::string v_path, std::string t_path, int64_t _HWND)
    : Napi::AsyncWorker(func), v_path(v_path), t_path(t_path), HWND(_HWND)
{
    mpv = mpv_create();
    // config mpv
    int flag = 1;
    mpv_set_property(mpv, "wid", MPV_FORMAT_INT64, &HWND);
    mpv_set_property(mpv, "pause", MPV_FORMAT_FLAG, &flag);
    mpv_set_property(mpv, "no-audio", MPV_FORMAT_FLAG, &flag);
    mpv_set_property_string(mpv, "hr-seek", "yes");                // precise seek
    mpv_set_property_string(mpv, "sid", "no");                     // disable sub
    mpv_set_property_string(mpv, "hwdec", "no");                   // disable hardware codec then use video filter
    mpv_set_property_string(mpv, "vf", "scale=240:135");           // downscale
    mpv_set_property_string(mpv, "screenshot-jpeg-quality", "30"); // lower screenshot quality
    mpv_set_property_string(mpv, "screenshot-directory", t_path.c_str());
    mpv_initialize(mpv);
    const char *cmd[] = {"loadfile", v_path.c_str(), NULL};
    mpv_command(mpv, cmd);
}

GenThumbsAsync::~GenThumbsAsync()
{
    mpv_terminate_destroy(mpv);
}

void GenThumbsAsync::Execute()
{
    int i = 0;
    while (i < 100)
    {
        std::string str = std::to_string(i);
        std::string file_name = t_path + "\\thumbs_test_";
        file_name += str;
        file_name += "_.jpg"; // relative path
        const char *cmd1[] = {"seek", str.c_str(), "absolute", NULL};
        mpv_command(mpv, cmd1);
        _sleep(200);
        const char *cmd[] = {"screenshot-to-file", file_name.c_str(), "video", NULL};
        mpv_command(mpv, cmd);
        i += 10;
    }
    return;
}

void GenThumbsAsync::OnOK()
{
    Callback().Call({Env().Null(), Napi::String::New(Env(), "haha")});
    return;
}