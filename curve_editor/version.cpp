#include <mkaul/include/http.hpp>
#include <nlohmann/json.hpp>
#include "version.hpp"
#include "global.hpp"
#include "constants.hpp"
#include "my_messagebox.hpp"
#include "string_table.hpp"


namespace cved {
	bool fetch_latest_version(mkaul::Version* p_version) {
		mkaul::http::Client client;
		std::vector<byte> data;
		DWORD status_code;
		auto url = std::format("{}/releases/latest", global::PLUGIN_GITHUB_URL);
		if (!client.open(url)) {
			return false;
		}
		auto result = client.get(&data, &status_code);
		client.close();
		if (result) {
			try {
				std::string result{ data.begin(), data.end() };
				auto j = nlohmann::json::parse(result);
				return p_version->from_str(j["tag_name"]);;
			}
			catch (nlohmann::json::parse_error&) {}
		}
		return false;
	}


	DWORD WINAPI check_for_updates(LPVOID param) {
		using StringId = global::StringTable::StringId;

		mkaul::Version latest;
		if (fetch_latest_version(&latest)) {
			if (global::PLUGIN_VERSION < latest) {
				if (param) {
					::EndDialog((HWND)param, 1);
				}
				auto text = std::format(
					"{}\n{}: {} → {}",
					global::string_table[StringId::InfoUpdateAvailable],
					global::string_table[StringId::WordVersion],
					global::PLUGIN_VERSION.str(),
					latest.str()
				);
				auto response = my_messagebox(text.c_str(), NULL, MessageBoxIcon::Information, MessageBoxButton::OkCancel);
				if (response == IDOK) {
					auto url = std::format("{}/releases/latest", global::PLUGIN_GITHUB_URL);
					::ShellExecuteA(NULL, "open", url.c_str(), NULL, NULL, SW_SHOWNORMAL);
				}
			}
			else if (param) {
				::EndDialog((HWND)param, 1);
				my_messagebox(global::string_table[StringId::InfoLatestVersion], NULL);
				
			}
		}
		else if (param) {
			::EndDialog((HWND)param, 1);
			my_messagebox(global::string_table[StringId::ErrorConnectionFailed], NULL);
		}

		::ExitThread(TRUE);
		return 0;
	}
}