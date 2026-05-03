// فایل: server.cpp
// برای اجرای این کد به هدر فایل httplib.h نیاز دارید
// (میتوانید از گیت‌هاب yhirose/cpp-httplib دانلود کنید)

#include "httplib.h"
#include <iostream>
#include <string>

int main() {
    // ساخت یک سرور
    httplib::Server svr;

    // تعریف مسیر مجازی (Route)
    // به سرور می‌گوییم: اگر کسی با متد POST به آدرس "/submit-data" آمد، این کارها را بکن:
    svr.Post("/submit-data", [](const httplib::Request& req, httplib::Response& res) {
        
        // ۱. خواندن داده‌های ارسال شده از فرم HTML شما بر اساس ویژگی name
        std::string fname = req.get_param_value("firstname");
        std::string city = req.get_param_value("city");
        
        // ۲. چاپ کردن اطلاعات در ترمینال بک‌اند (برای اینکه شما ببینید)
        std::cout << "--- New Form Submitted! ---" << std::endl;
        std::cout << "Name: " << fname << std::endl;
        std::cout << "City: " << city << std::endl;
        std::cout << "---------------------------" << std::endl;

        // ۳. تنظیم هدر CORS تا Live Server بتواند جواب را دریافت کند
        res.set_header("Access-Control-Allow-Origin", "*");

        // ۴. فرستادن جواب به مرورگر کاربر
        res.set_content("اطلاعات شما با موفقیت توسط بک اند C++ دریافت شد!", "text/plain; charset=utf-8");
    });

    // روشن کردن سرور روی پورت 8080 سیستم شما (لوکال هاست)
    std::cout << "C++ Backend Server is running on http://localhost:8080" << std::endl;
    svr.listen("localhost", 8080);

    return 0;
}
