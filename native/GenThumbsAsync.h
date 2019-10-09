#include "include/napi.h"
#include "include/client.h"

class GenThumbsAsync : public Napi::AsyncWorker
{
private:
    std::string v_path, t_path;
    mpv_handle *mpv = nullptr;
    int64_t HWND;
    /**
     * First pass: take screenshot by every 8s
     * Second pass: taks screenshot at 5s of every 4s
     * Third pass: at 2s of every 4s
     * Each pass will call the callback once.
     */
    int pass = 0;
    int64_t duration;
    void DoGenThumb(int64_t sec);

public:
    GenThumbsAsync(Napi::Function &func, std::string v_path, std::string t_path, int64_t HWND);
    ~GenThumbsAsync() override;

    void Execute() override;
    void OnOK() override;
};