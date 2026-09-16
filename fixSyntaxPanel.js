const fs = require("fs");
let c = fs.readFileSync("components/AuthPlayer.tsx", "utf8");

// Try matching flex-1 end and w-96 end
const searchStr = `                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>`;
      
const replaceStr = `                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>`;

c = c.replace(searchStr, replaceStr);
fs.writeFileSync("components/AuthPlayer.tsx", c);
console.log("Fixed syntax panel closing");
